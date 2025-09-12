import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

export const runtime = "nodejs";

// Validate payload
const LoginSchema = z.object({
  email: z.string().email("รูปแบบอีเมลไม่ถูกต้อง"),
  password: z.string().min(1, "กรุณากรอกรหัสผ่าน"),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = LoginSchema.safeParse(json);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const email = parsed.data.email.trim().toLowerCase();
    const password = parsed.data.password;

    // ดึงเฉพาะฟิลด์ที่จำเป็น (อย่า select เกิน)
    const user = await db.profile.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        role: true,
        firstName: true,
        lastName: true,
        isActive: true,
      },
    });

    // ใช้ข้อความรวมเพื่อลด user enumeration
    if (!user || !user.password) {
      return NextResponse.json({ error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
    }

    if (!user.isActive) {
      return NextResponse.json({ error: "บัญชีถูกปิดการใช้งาน" }, { status: 403 });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return NextResponse.json({ error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
    }

    // สร้าง response และตั้ง cookie ปลอดภัย
    const res = NextResponse.json(
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

    const commonCookie = {
      path: "/",
      httpOnly: true as const,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 1 วัน
    };

    // ใช้ร่วมกับ getRoleFromCookie()
    res.cookies.set("userId", user.id, commonCookie);
    res.cookies.set("role", user.role, commonCookie);

    // (ออปชัน) cookie ฝั่ง client ใช้โชว์ UI เท่านั้น ไม่สำคัญด้านความปลอดภัย
    res.cookies.set("loggedIn", "1", {
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      httpOnly: false,
      maxAge: 60 * 60 * 24,
    });

    return res;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในระบบ" }, { status: 500 });
  }
}
