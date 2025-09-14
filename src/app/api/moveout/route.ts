import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { z } from "zod";
import dayjs from "dayjs";
import { MoveOutStatus } from "@prisma/client";

const moveOutSchema = z.object({
  roomId: z.string().uuid(),
  reason: z.string().min(5, "กรุณาระบุเหตุผลให้ครบถ้วน"),
  moveOutDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "วันที่ไม่ถูกต้อง",
  }),
  password: z.string().min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"),
  acceptTerms: z.boolean().refine((v) => v === true, {
    message: "คุณต้องยอมรับเงื่อนไขการยื่นคำร้อง",
  }),
});

const ACTIVE_STATUSES: MoveOutStatus[] = [
  MoveOutStatus.PENDING_APPROVAL,
  MoveOutStatus.APPROVED,
];

export async function POST(req: NextRequest) {
  try {
    // 1) auth
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;
    const role = cookieStore.get("role")?.value;
    if (!userId || role !== "user") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2) validate
    const body = await req.json();
    const parsed = moveOutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    }
    const { roomId, reason, moveOutDate, password } = parsed.data;

    // 3) ตรวจรหัสผ่าน + ห้องที่พักจริง
    const user = await db.profile.findUnique({
      where: { id: userId },
      select: { id: true, password: true, roomId: true },
    });
    if (!user) return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });

    const passOk = await bcrypt.compare(password, user.password);
    if (!passOk) {
      return NextResponse.json(
        { error: { password: ["รหัสผ่านไม่ถูกต้อง"] } },
        { status: 400 }
      );
    }

    if (!user.roomId || user.roomId !== roomId) {
      return NextResponse.json(
        { error: "ไม่สามารถยื่นคำร้องสำหรับห้องที่คุณไม่ได้พักอยู่" },
        { status: 400 }
      );
    }

    // 4) กันยื่นซ้ำถ้ามีคำร้องสถานะ active
    const existing = await db.moveOutRequest.findFirst({
      where: { userId, status: { in: ACTIVE_STATUSES } },
      select: { id: true, status: true },
    });
    if (existing) {
      return NextResponse.json(
        { error: "คุณได้ยื่นคำร้องไปแล้ว (ยังไม่ปิดคำร้องเดิม)" },
        { status: 400 }
      );
    }

    // 5) ตรวจวัน (เทียบแบบ startOf('day'))
    const today = dayjs().startOf("day");
    const moveDate = dayjs(moveOutDate).startOf("day");

    if (moveDate.diff(today, "day") < 30) {
      return NextResponse.json(
        { error: "ต้องยื่นคำร้องล่วงหน้าอย่างน้อย 30 วัน" },
        { status: 400 }
      );
    }
    if (moveDate.month() === today.month() && moveDate.year() === today.year()) {
      return NextResponse.json(
        { error: "ไม่สามารถยื่นคำร้องภายในเดือนปัจจุบันได้" },
        { status: 400 }
      );
    }

    // 6) บันทึกคำร้องเป็น PENDING_APPROVAL
    await db.moveOutRequest.create({
      data: {
        userId,
        roomId,
        reason: reason.trim(),
        moveOutDate: moveDate.toDate(),
        status: MoveOutStatus.PENDING_APPROVAL,
      },
    });

    return NextResponse.json({ message: "ส่งคำร้องเรียบร้อยแล้ว" });
  } catch (err) {
    console.error("❌ Moveout error:", err);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการส่งคำร้อง" },
      { status: 500 }
    );
  }
}
