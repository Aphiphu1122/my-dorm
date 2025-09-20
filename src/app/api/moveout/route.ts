// src/app/api/moveout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getUserIdFromCookie, getRoleFromCookie } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import dayjs from "dayjs";
import { MoveOutStatus } from "@prisma/client";

/** เส้นทางที่อิงคุกกี้ → กันแคชทั้งหมด */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
const noStore = {
  "Cache-Control": "no-store, no-cache, must-revalidate, private",
} as const;

/** ===== Validation ===== */
const moveOutSchema = z.object({
  roomId: z.string().uuid(),
  reason: z.string().min(5, "กรุณาระบุเหตุผลให้ครบถ้วน"),
  moveOutDate: z.string().refine((val) => !Number.isNaN(Date.parse(val)), {
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

/** ===== POST: ส่งคำร้องย้ายออก ===== */
export async function POST(req: NextRequest) {
  try {
    // 1) auth จากคุกกี้
    const userId = await getUserIdFromCookie();
    const role = await getRoleFromCookie();
    if (!userId || role !== "user") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: noStore }
      );
    }

    // 2) validate body
    const body = await req.json();
    const parsed = moveOutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400, headers: noStore }
      );
    }
    const { roomId, reason, moveOutDate, password } = parsed.data;

    // 3) ตรวจรหัสผ่าน + ห้องผู้ใช้จริง
    const user = await db.profile.findUnique({
      where: { id: userId },
      select: { id: true, password: true, roomId: true },
    });
    if (!user || !user.password) {
      return NextResponse.json(
        { error: "ไม่พบผู้ใช้" },
        { status: 404, headers: noStore }
      );
    }

    const passOk = await bcrypt.compare(password, user.password);
    if (!passOk) {
      return NextResponse.json(
        { error: { password: ["รหัสผ่านเดิมไม่ถูกต้อง"] } },
        { status: 400, headers: noStore }
      );
    }

    if (!user.roomId || user.roomId !== roomId) {
      return NextResponse.json(
        { error: "ไม่สามารถยื่นคำร้องสำหรับห้องที่คุณไม่ได้พักอยู่" },
        { status: 400, headers: noStore }
      );
    }

    // (ออปชัน) ยืนยันว่าห้องมีอยู่จริง
    const room = await db.room.findUnique({
      where: { id: roomId },
      select: { id: true },
    });
    if (!room) {
      return NextResponse.json(
        { error: "ไม่พบห้องที่ระบุ" },
        { status: 404, headers: noStore }
      );
    }

    // 4) กันยื่นซ้ำถ้ายังมีคำร้อง active
    const existing = await db.moveOutRequest.findFirst({
      where: { userId, status: { in: ACTIVE_STATUSES } },
      select: { id: true, status: true },
    });
    if (existing) {
      return NextResponse.json(
        { error: "คุณได้ยื่นคำร้องไปแล้วและยังอยู่ระหว่างดำเนินการ" },
        { status: 400, headers: noStore }
      );
    }

    // 5) ตรวจวันที่: ต้อง >= 30 วัน และห้ามเดือนปัจจุบัน
    const today = dayjs().startOf("day");
    const moveDate = dayjs(moveOutDate).startOf("day");
    if (!moveDate.isValid()) {
      return NextResponse.json(
        { error: { moveOutDate: ["วันที่ไม่ถูกต้อง"] } },
        { status: 400, headers: noStore }
      );
    }
    if (moveDate.diff(today, "day") < 30) {
      return NextResponse.json(
        { error: "ต้องยื่นคำร้องล่วงหน้าอย่างน้อย 30 วัน" },
        { status: 400, headers: noStore }
      );
    }
    if (moveDate.month() === today.month() && moveDate.year() === today.year()) {
      return NextResponse.json(
        { error: "ไม่สามารถยื่นคำร้องภายในเดือนปัจจุบันได้" },
        { status: 400, headers: noStore }
      );
    }

    // 6) บันทึกคำร้อง (สถานะเริ่มต้น PENDING_APPROVAL)
    await db.moveOutRequest.create({
      data: {
        userId,
        roomId,
        reason: reason.trim(),
        moveOutDate: moveDate.toDate(),
        status: MoveOutStatus.PENDING_APPROVAL,
      },
    });

    return NextResponse.json(
      { message: "ส่งคำร้องเรียบร้อยแล้ว" },
      { status: 200, headers: noStore }
    );
  } catch (err) {
    console.error("❌ Moveout error:", err);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการส่งคำร้อง" },
      { status: 500, headers: noStore }
    );
  }
}
