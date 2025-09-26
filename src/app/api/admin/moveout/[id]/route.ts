// src/app/api/admin/moveout/[id]/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/prisma";
import { getRoleFromCookie } from "@/lib/auth";
import { z } from "zod";
import { MoveOutStatus, BillStatus, RoomStatus } from "@prisma/client";

/** เส้นทางอาศัยคุกกี้ → ปิดแคชทั้งหมด */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
const noStore = {
  "Cache-Control": "no-store, no-cache, must-revalidate, private",
} as const;

/** ===== Validation ===== */
const ParamsSchema = z.object({ id: z.string().min(1, "invalid id") });

// PATCH: รับ APPROVED/REJECTED และบังคับ note เมื่อ REJECTED
const PatchBodySchema = z
  .object({
    status: z.enum([MoveOutStatus.APPROVED, MoveOutStatus.REJECTED] as const),
    note: z.string().trim().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.status === MoveOutStatus.REJECTED && !val.note) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "กรุณาระบุหมายเหตุ (note) เมื่อปฏิเสธคำร้อง",
        path: ["note"],
      });
    }
  });

/** ===== GET: รายละเอียดคำร้องย้ายออก (รวมบิลค้างของผู้เช่า) ===== */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const role = await getRoleFromCookie();
    if (role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: noStore });
    }

    const { id } = ParamsSchema.parse(params);

    const request = await db.moveOutRequest.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        reason: true,
        note: true,
        moveOutDate: true,
        createdAt: true,
        userId: true,
        roomId: true,
        room: { select: { id: true, roomNumber: true, status: true } },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            bills: {
              where: { status: BillStatus.UNPAID },
              select: { id: true, totalAmount: true, billingMonth: true, status: true },
            },
          },
        },
      },
    });

    if (!request) {
      return NextResponse.json({ error: "Move-out request not found" }, { status: 404, headers: noStore });
    }

    return NextResponse.json({ success: true, request }, { status: 200, headers: noStore });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.flatten() }, { status: 400, headers: noStore });
    }
    console.error("Fetch moveout error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500, headers: noStore });
  }
}

/** ===== PATCH: อนุมัติ/ปฏิเสธคำร้องย้ายออก ===== */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const role = await getRoleFromCookie();
    if (role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: noStore });
    }

    const { id } = ParamsSchema.parse(params);
    const { status, note } = PatchBodySchema.parse(await req.json());

    const request = await db.moveOutRequest.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        userId: true,
        roomId: true,
        moveOutDate: true,
        room: { select: { id: true, status: true } },
        user: {
          select: {
            id: true,
            bills: { where: { status: BillStatus.UNPAID }, select: { id: true } },
          },
        },
      },
    });

    if (!request) {
      return NextResponse.json({ error: "Move-out request not found" }, { status: 404, headers: noStore });
    }

    // ต้องเริ่มจาก PENDING_APPROVAL เท่านั้น
    if (request.status !== MoveOutStatus.PENDING_APPROVAL) {
      return NextResponse.json(
        { error: `This request was already ${request.status.toLowerCase()}` },
        { status: 409, headers: noStore }
      );
    }

    // ห้ามอนุมัติถ้ามีบิลค้าง
    if (status === MoveOutStatus.APPROVED && request.user.bills.length > 0) {
      return NextResponse.json(
        { error: "ไม่สามารถอนุมัติได้ เนื่องจากผู้ใช้งานยังมีบิลค้างชำระ" },
        { status: 422, headers: noStore }
      );
    }

    // ยืนยันว่าผู้ใช้งานยังพักอยู่ห้องนี้จริง
    if (status === MoveOutStatus.APPROVED) {
      const profile = await db.profile.findUnique({
        where: { id: request.userId },
        select: { roomId: true },
      });
      if (!profile || profile.roomId !== request.roomId) {
        return NextResponse.json({ error: "Room tenant mismatch" }, { status: 409, headers: noStore });
      }
    }

    // ทำเป็นทรานแซกชัน + กัน concurrent updates
    const result = await db.$transaction(async (tx) => {
      // อัปเดตสถานะคำร้อง + บันทึก note เมื่อ REJECTED
      const updatedRequest = await tx.moveOutRequest.update({
        where: { id: request.id },
        data: {
          status,
          ...(status === MoveOutStatus.REJECTED && note ? { note } : {}),
        },
      });

      if (status === MoveOutStatus.APPROVED) {
        // 1) ปลดห้องให้ว่าง: ล็อกสถานะเดิมต้องเป็น OCCUPIED
        const roomRes = await tx.room.updateMany({
          where: { id: request.roomId, status: RoomStatus.OCCUPIED },
          data: { status: RoomStatus.AVAILABLE },
        });
        if (roomRes.count !== 1) {
          throw new Error("Room status changed by another process. Please retry.");
        }

        // 2) ตัดผู้เช่าออกจากห้อง: ล็อกว่าปัจจุบันยังอยู่ห้องนี้
        const profileRes = await tx.profile.updateMany({
          where: { id: request.userId, roomId: request.roomId },
          data: {
            roomId: null,
            isActive: false,
            moveOutDate: request.moveOutDate, // ใช้วันที่ในคำร้อง
          },
        });
        if (profileRes.count !== 1) {
          throw new Error("Profile-room relation changed by another process. Please retry.");
        }
      }

      // 3) แจ้งเตือนผู้ใช้ (notification.type เป็น string ตามสคีมา)
      const message =
        status === MoveOutStatus.APPROVED
          ? "📢 คำร้องย้ายออกของคุณได้รับการอนุมัติ ✅"
          : `📢 คำร้องย้ายออกของคุณถูกปฏิเสธ ❌${note ? `\nหมายเหตุ: ${note}` : ""}`;

      await tx.notification.create({
        data: { userId: request.userId, message, type: "MOVEOUT" },
      });

      return updatedRequest;
    });

    return NextResponse.json({ success: true, request: result }, { status: 200, headers: noStore });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.flatten() }, { status: 400, headers: noStore });
    }
    console.error("Update moveout error:", err);
    return NextResponse.json({ error: "Failed to update moveout status" }, { status: 500, headers: noStore });
  }
}
