import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";

const prisma = new PrismaClient();

// ✅ ตรวจสอบ input โดยใช้ Zod
const RegisterSchema = z.object({
  firstName: z.string().min(1, "กรุณาระบุชื่อ"),
  lastName: z.string().min(1, "กรุณาระบุนามสกุล"),
  email: z.string().email("รูปแบบอีเมลไม่ถูกต้อง"),
  phone: z.string().min(9, "กรุณาระบุเบอร์โทรให้ครบถ้วน"),
  birthday: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "วันเกิดไม่ถูกต้อง" }),
  address: z.string().min(1, "กรุณาระบุที่อยู่"),
  nationalId: z.string().min(13, "เลขบัตรประชาชนไม่ถูกต้อง"),
  password: z.string().min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"),
  confirmPassword: z.string(),
  supabaseId: z.string().uuid("รูปแบบ User ID ไม่ถูกต้อง"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "รหัสผ่านไม่ตรงกัน",
  path: ["confirmPassword"],
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // ✅ validate body
    const result = RegisterSchema.safeParse(body);
    if (!result.success) {
      const errorMessage = result.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง";
      return new Response(JSON.stringify({ error: errorMessage }), { status: 400 });
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
      supabaseId,
    } = result.data;

    // ✅ ตรวจสอบว่า email มีอยู่แล้วหรือยัง
    const existing = await prisma.profile.findUnique({
  where: { email },
});
if (existing) {
  return new Response(
    JSON.stringify({ error: "อีเมลนี้ถูกใช้งานแล้ว" }),
    { status: 400 }
  );
}

    // ✅ เข้ารหัสรหัสผ่าน
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ สร้างผู้ใช้
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
        userId: supabaseId,
      },
    });

    return new Response(JSON.stringify({ message: "สมัครสมาชิกสำเร็จ", user }), { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    return new Response(JSON.stringify({ error: "เกิดข้อผิดพลาดภายในระบบ" }), { status: 500 });
  } finally {
    await prisma.$disconnect(); // ✅ ปิดการเชื่อมต่อ Prisma
  }
}
