// src/app/api/moveout/[id]/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getRoleFromCookie } from "@/lib/auth";
import { z } from "zod";

/** เส้นทางนี้อาศัยคุกกี้ → ปิดแคชทั้งหมด */
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

/** ===== PATCH: อนุมัติ/ปฏิเสธคำร้องย้ายออก ===== */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 🔐 verify admin
    const role = await getRoleFromCookie();
    if (role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401, headers: noStore });
    }

    // 🧾 validate input
    const { id } = ParamsSchema.parse(params);
    const { status } = PatchBodySchema.parse(await req.json());

    // 🔎 load request + ข้อมูลจำเป็น
    const request = await db.moveOutRequest.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        userId: true,
        roomId: true,
        user: {
          select: {
            id: true,
            bills: { where: { status: "UNPAID" }, select: { id: true } },
            roomId: true,
          },
        },
        room: { select: { id: true, status: true } },
      },
    });

    if (!request) {
      return NextResponse.json({ message: "Moveout request not found" }, { status: 404, headers: noStore });
    }

    // กันยืนยันซ้ำ (ต้องเริ่มจาก PENDING_APPROVAL)
    if (request.status !== "PENDING_APPROVAL") {
      return NextResponse.json(
        { message: `This request was already ${request.status.toLowerCase()}` },
        { status: 409, headers: noStore }
      );
    }

    // อนุมัติได้ก็ต่อเมื่อไม่มีบิลค้าง + โปรไฟล์ยังผูกห้องเดียวกัน
    if (status === "APPROVED") {
      if (request.user.bills.length > 0) {
        return NextResponse.json(
          { message: "ไม่สามารถอนุมัติได้ เนื่องจากผู้ใช้งานยังมีบิลค้างชำระ" },
          { status: 422, headers: noStore }
        );
      }
      if (!request.user.roomId || request.user.roomId !== request.roomId) {
        return NextResponse.json({ message: "Room tenant mismatch" }, { status: 409, headers: noStore });
      }
    }

    // ✅ ทำงานแบบ transaction เพื่อความถูกต้อง
    const updatedRequest = await db.$transaction(async (tx) => {
      // อัปเดตสถานะคำร้อง
      const updated = await tx.moveOutRequest.update({
        where: { id: request.id },
        data: { status },
      });

      if (status === "APPROVED") {
        // ห้องกลับเป็นว่าง
        await tx.room.update({
          where: { id: request.roomId },
          data: { status: "AVAILABLE" }, // อย่าลบ tenantId ถ้า schema ไม่มีฟิลด์นี้
        });

        // ตัดสัมพันธ์โปรไฟล์ออกจากห้อง + ปิด active
        await tx.profile.update({
          where: { id: request.userId },
          data: {
            roomId: null,
            isActive: false,
            moveOutDate: new Date(),
          },
        });
      }

      // แจ้งเตือนผู้ใช้
      const message =
        status === "APPROVED"
          ? "📢 คำร้องย้ายออกของคุณได้รับการอนุมัติ ✅"
          : "📢 คำร้องย้ายออกของคุณถูกปฏิเสธ ❌";

      await tx.notification.create({
        data: {
          userId: request.userId,
          message,
          type: "MOVEOUT",
        },
      });

      return updated;
    });

    return NextResponse.json({ success: true, request: updatedRequest }, { status: 200, headers: noStore });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.flatten() }, { status: 400, headers: noStore });
    }
    console.error("Update moveout status error:", err);
    return NextResponse.json({ message: "Failed to update status" }, { status: 500, headers: noStore });
  }
}
