import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getRoleFromCookie } from "@/lib/auth";
import { z } from "zod";

/** ===== Validation ===== */
const ParamsSchema = z.object({ id: z.string().min(1, "invalid id") });
const PatchBodySchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
});

/** ===== GET: รายละเอียดคำร้องย้ายออก (รวมบิลค้างของผู้เช่า) ===== */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const role = await getRoleFromCookie();
    if (role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
        room: {
          select: { id: true, roomNumber: true, status: true },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            bills: {
              where: { status: "UNPAID" },
              select: { id: true, totalAmount: true, billingMonth: true, status: true },
            },
          },
        },
      },
    });

    if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(request);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.flatten() }, { status: 400 });
    }
    console.error("Fetch moveout error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/** ===== PATCH: อนุมัติ/ปฏิเสธคำร้องย้ายออก ===== */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const role = await getRoleFromCookie();
    if (role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = ParamsSchema.parse(params);
    const { status } = PatchBodySchema.parse(await req.json()); // APPROVED | REJECTED

    // โหลดคำร้อง + ข้อมูลที่ต้องใช้ตรวจสอบ
    const request = await db.moveOutRequest.findUnique({
      where: { id },
      select: {
        id: true,
        status: true, // PENDING_APPROVAL | APPROVED | REJECTED
        userId: true, // profile.id
        roomId: true,
        room: { select: { id: true, status: true } },
        user: {
          select: {
            id: true, // profile.id
            bills: { where: { status: "UNPAID" }, select: { id: true } },
          },
        },
      },
    });

    if (!request) {
      return NextResponse.json({ error: "Moveout request not found" }, { status: 404 });
    }

    // กันยืนยันซ้ำ (ต้องเริ่มต้นจาก PENDING_APPROVAL)
    if (request.status !== "PENDING_APPROVAL") {
      return NextResponse.json(
        { error: `This request was already ${request.status.toLowerCase()}` },
        { status: 409 }
      );
    }

    // (ตัวเลือกตามนโยบาย) ถ้ามีบิลค้างชำระ ห้ามอนุมัติ
    // ปิดบรรทัดนี้ถ้าไม่ต้องการบล็อก
    if (status === "APPROVED" && request.user.bills.length > 0) {
      return NextResponse.json({ error: "User still has unpaid bills" }, { status: 422 });
    }

     if (status === "APPROVED") {
      // ดึง profile ของผู้ใช้มาเช็ก roomId
      const profile = await db.profile.findUnique({
        where: { id: request.userId },
        select: { roomId: true },
      });

      if (!profile || profile.roomId !== request.roomId) {
        return NextResponse.json({ error: "Room tenant mismatch" }, { status: 409 });
      }
    }

    // ทำทุกอย่างเป็นทรานแซกชัน (atomic)
    const result = await db.$transaction(async (tx) => {
      // อัปเดตสถานะคำร้อง
      const updatedRequest = await tx.moveOutRequest.update({
        where: { id: request.id },
        data: { status }, // APPROVED | REJECTED
      });

      if (status === "APPROVED") {
        // ปล่อยห้องว่างและเลิกผูกผู้เช่า
        await tx.room.update({
          where: { id: request.roomId },
          data: { status: "AVAILABLE" },
        });
        await tx.profile.update({
          where: { id: request.userId },
          data: {
            roomId: null,
            isActive: false,
            moveOutDate: new Date(),
          },
        });
              }

      // แจ้งเตือนผู้ใช้ (profile.id)
      const message =
        status === "APPROVED"
          ? "📢 คำร้องย้ายออกของคุณได้รับการอนุมัติ ✅"
          : "📢 คำร้องย้ายออกของคุณถูกปฏิเสธ ❌";

      await tx.notification.create({
        data: {
          userId: request.userId, // profile.id
          message,
          type: "MOVEOUT",
        },
      });

      return updatedRequest;
    });

    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.flatten() }, { status: 400 });
    }
    console.error("Update moveout error:", err);
    return NextResponse.json({ error: "Failed to update moveout status" }, { status: 500 });
  }
}
