// src/app/api/admin/moveout/[id]/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/prisma";
import { getRoleFromCookie } from "@/lib/auth";
import { z } from "zod";

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
const PatchBodySchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
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
              where: { status: "UNPAID" },
              select: { id: true, totalAmount: true, billingMonth: true, status: true },
            },
          },
        },
      },
    });

    if (!request) {
      return NextResponse.json({ error: "Not found" }, { status: 404, headers: noStore });
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
    const { status } = PatchBodySchema.parse(await req.json());

    const request = await db.moveOutRequest.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        userId: true,
        roomId: true,
        room: { select: { id: true, status: true } },
        user: {
          select: {
            id: true,
            bills: { where: { status: "UNPAID" }, select: { id: true } },
          },
        },
      },
    });

    if (!request) {
      return NextResponse.json({ error: "Moveout request not found" }, { status: 404, headers: noStore });
    }

    // กันยืนยันซ้ำ (ต้องเริ่มจาก PENDING_APPROVAL)
    if (request.status !== "PENDING_APPROVAL") {
      return NextResponse.json(
        { error: `This request was already ${request.status.toLowerCase()}` },
        { status: 409, headers: noStore }
      );
    }

    // ถ้ามีบิลค้างชำระ → ห้ามอนุมัติ
    if (status === "APPROVED" && request.user.bills.length > 0) {
      return NextResponse.json(
        { error: "ไม่สามารถอนุมัติได้ เนื่องจากผู้ใช้งานยังมีบิลค้างชำระ" },
        { status: 422, headers: noStore }
      );
    }

    // ยืนยันว่า profile ยังพักอยู่ห้องนี้จริง
    if (status === "APPROVED") {
      const profile = await db.profile.findUnique({
        where: { id: request.userId },
        select: { roomId: true },
      });
      if (!profile || profile.roomId !== request.roomId) {
        return NextResponse.json({ error: "Room tenant mismatch" }, { status: 409, headers: noStore });
      }
    }

    // ทำเป็นทรานแซกชัน
    const result = await db.$transaction(async (tx) => {
      const updatedRequest = await tx.moveOutRequest.update({
        where: { id: request.id },
        data: { status },
      });

      if (status === "APPROVED") {
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

      const message =
        status === "APPROVED"
          ? "📢 คำร้องย้ายออกของคุณได้รับการอนุมัติ ✅"
          : "📢 คำร้องย้ายออกของคุณถูกปฏิเสธ ❌";

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
