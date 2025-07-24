import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";

const prisma = new PrismaClient();

// ✅ สร้าง schema ด้วย Zod
const RegisterSchema = z
  .object({
    firstName: z.string().min(1, "กรุณาระบุชื่อ"),
    lastName: z.string().min(1, "กรุณาระบุนามสกุล"),
    email: z.string().email("รูปแบบอีเมลไม่ถูกต้อง"),
    phone: z.string().min(9, "กรุณาระบุเบอร์โทรให้ครบถ้วน"),
    birthday: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "วันเกิดไม่ถูกต้อง",
    }),
    address: z.string().min(1, "กรุณาระบุที่อยู่"),
    nationalId: z.string().length(13, "เลขบัตรประชาชนต้องมี 13 หลัก"),
    password: z.string().min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"),
    confirmPassword: z.string(),
    userId: z.string().uuid("รูปแบบ userId (UUID) ไม่ถูกต้อง"),
    role: z.enum(["user", "admin"]).default("user"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "รหัสผ่านไม่ตรงกัน",
    path: ["confirmPassword"],
  });

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // ✅ Validate input
    const result = RegisterSchema.safeParse(body);
    if (!result.success) {
      const errorMessage =
        result.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง";
      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 400,
      });
    }

    const {
      firstName,
      lastName,
      email,
      phone,
      birthday,
      address,
      nationalId,
      password,
      userId,
      role,
    } = result.data;

    // ✅ ตรวจสอบซ้ำ (email / nationalId / userId)
    const existing = await prisma.profile.findFirst({
      where: {
        OR: [
          { email },
          { nationalId },
          { userId },
        ],
      },
    });

    if (existing) {
      return new Response(
        JSON.stringify({
          error: "มีผู้ใช้นี้อยู่แล้ว (email, บัตร ปชช. หรือ userId ซ้ำ)",
        }),
        { status: 409 }
      );
    }

    // ✅ เข้ารหัสรหัสผ่าน
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ บันทึกลงฐานข้อมูล
    const user = await prisma.profile.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        birthday: new Date(birthday),
        address,
        nationalId,
        password: hashedPassword,
        userId,
        role,
      },
    });

    return new Response(
      JSON.stringify({ message: "สมัครสมาชิกสำเร็จ", user }),
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return new Response(
      JSON.stringify({ error: "เกิดข้อผิดพลาดภายในระบบ" }),
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect(); // ปิด connection
  }
}
