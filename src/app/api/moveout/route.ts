import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { z } from "zod";
import dayjs from "dayjs";

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

export async function POST(req: NextRequest) {
  try {
    // ✅ ดึง userId + role จาก cookie
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;
    const role = cookieStore.get("role")?.value;

    if (!userId || role !== "user") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ รับและตรวจสอบข้อมูล input ด้วย Zod
    const body = await req.json();
    const parse = moveOutSchema.safeParse(body);

    if (!parse.success) {
      const formatted = parse.error.format();
      return NextResponse.json({ error: formatted }, { status: 400 });
    }

    const { roomId, reason, moveOutDate, password } = parse.data;

    // ✅ ตรวจสอบว่าผู้ใช้เคยยื่นคำร้องไปแล้วหรือยัง
    const existing = await db.moveOutRequest.findFirst({
      where: { userId },
    });
    if (existing) {
      return NextResponse.json(
        { error: "คุณได้ยื่นคำร้องไปแล้ว" },
        { status: 400 }
      );
    }

    // ✅ ตรวจสอบรหัสผ่าน
    const user = await db.profile.findUnique({ where: { id: userId } });
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return NextResponse.json(
        { error: { password: ["รหัสผ่านไม่ถูกต้อง"] } },
        { status: 400 }
      );
    }

    // ✅ ตรวจสอบวันย้ายออก
    const today = dayjs();
    const moveDate = dayjs(moveOutDate);

    // ต้องอย่างน้อย 30 วันล่วงหน้า
    if (moveDate.diff(today, "day") < 30) {
      return NextResponse.json(
        { error: "ต้องยื่นคำร้องล่วงหน้าอย่างน้อย 30 วัน" },
        { status: 400 }
      );
    }

    // ต้องเป็นเดือนถัดไปหรือหลังจากนั้น ห้ามเป็นเดือนเดียวกับวันนี้
    if (moveDate.month() === today.month() && moveDate.year() === today.year()) {
      return NextResponse.json(
        { error: "ไม่สามารถยื่นคำร้องภายในเดือนปัจจุบันได้" },
        { status: 400 }
      );
    }

    // ✅ สร้างคำร้องย้ายออก
    await db.moveOutRequest.create({
      data: {
        userId,
        roomId,
        reason,
        moveOutDate: moveDate.toDate(),
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
