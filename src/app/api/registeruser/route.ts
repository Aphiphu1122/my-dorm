import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  phone: z.string(),
  birthday: z.string(),
  address: z.string(),
  nationalId: z.string(),
  password: z.string().min(6),
  confirmPassword: z.string(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
    }

    const {
      firstName, lastName, email, phone,
      birthday, address, nationalId, password,
    } = parsed.data;

    const exists = await db.user.findFirst({
      where: { OR: [{ email }, { nationalId }] },
    });

    if (exists) {
      return NextResponse.json({ error: "อีเมลหรือบัตรประชาชนนี้ถูกใช้งานแล้ว" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.user.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        birthday: new Date(birthday),
        address,
        nationalId,
        password: hashedPassword,
      },
    });

    return NextResponse.json({ message: "ส่งคำขอสมัครเรียบร้อย" });

  } catch (error) {
    const err = error as Error;
    console.error("❌ API Error:", err.message);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในระบบ" }, { status: 500 });
  }
}
