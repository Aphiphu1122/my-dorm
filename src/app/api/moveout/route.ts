import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { z } from "zod";

const moveOutSchema = z.object({
  roomId: z.string().uuid(),
  reason: z.string().min(5, "กรุณาระบุเหตุผลให้ครบถ้วน"),
  moveOutDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "วันที่ไม่ถูกต้อง",
  }),
  password: z.string().min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"),
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
      return NextResponse.json({ error: "คุณได้ยื่นคำร้องไปแล้ว" }, { status: 400 });
    }

    // ✅ ตรวจสอบรหัสผ่าน
    const user = await db.profile.findUnique({ where: { id: userId } });
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return NextResponse.json({ error: { password: ["รหัสผ่านไม่ถูกต้อง"] } }, { status: 400 });
    }

    // ✅ ตรวจสอบว่ามีบิลค้างชำระหรือไม่
    const unpaidBills = await db.bill.findMany({
      where: {
        tenantId: userId,
        status: {
          not: "PAID",
        },
      },
    });

    if (unpaidBills.length > 0) {
      return NextResponse.json({
        error: "คุณมีบิลที่ยังไม่ได้ชำระ กรุณาชำระให้เรียบร้อยก่อนแจ้งย้ายออก",
      }, { status: 400 });
    }

    // ✅ สร้างคำร้องย้ายออก
    await db.moveOutRequest.create({
      data: {
        userId,
        roomId,
        reason,
        moveOutDate: new Date(moveOutDate),
      },
    });

    return NextResponse.json({ message: "ส่งคำร้องเรียบร้อยแล้ว" });

  } catch (err) {
    console.error("❌ Moveout error:", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการส่งคำร้อง" }, { status: 500 });
  }
}
