import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    // ✅ ค้นหาผู้ใช้จาก email
    const user = await prisma.profile.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: "ไม่พบผู้ใช้งาน" }, { status: 404 });
    }

    // ✅ ตรวจสอบรหัสผ่านด้วย bcrypt
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: "รหัสผ่านไม่ถูกต้อง" }, { status: 401 });
    }

    // ✅ สร้าง cookie สำหรับ role
    const response = NextResponse.json(
      {
        message: "เข้าสู่ระบบสำเร็จ",
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      },
      { status: 200 }
    );

    // ✅ ตั้ง cookie role
    response.cookies.set("role", user.role, {
      path: "/",
      httpOnly: true,
      maxAge: 60 * 60 * 24, // 1 วัน
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
