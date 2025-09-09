// src/app/api/registeruser/route.ts
import { db } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

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
    roomId: z.string().uuid("กรุณาระบุรหัสห้องที่ถูกต้อง"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "รหัสผ่านไม่ตรงกัน",
    path: ["confirmPassword"],
  });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง";
      return new Response(JSON.stringify({ error: msg }), { status: 400 });
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
      roomId,
    } = parsed.data;

    // ✅ ตรวจว่าห้องมีอยู่และว่าง (ไม่มีใครถืออยู่ และสถานะ AVAILABLE)
    const room = await db.room.findUnique({ where: { id: roomId } });
    if (!room) {
      return new Response(JSON.stringify({ error: "ไม่พบห้องที่เลือก" }), { status: 404 });
    }
    if (room.status !== "AVAILABLE") {
      return new Response(JSON.stringify({ error: "ห้องนี้ไม่ว่าง" }), { status: 400 });
    }
    // กันเคสมีโปรไฟล์ถือ roomId นี้อยู่ (กันชนกับ unique ด้วย)
    const someoneInThisRoom = await db.profile.findFirst({ where: { roomId } });
    if (someoneInThisRoom) {
      return new Response(JSON.stringify({ error: "มีผู้เช่าห้องนี้อยู่แล้ว" }), { status: 400 });
    }

    // ✅ ตรวจซ้ำ (email / nationalId / userId)
    const existing = await db.profile.findFirst({
      where: { OR: [{ email }, { nationalId }, { userId }] },
      select: { id: true },
    });
    if (existing) {
      return new Response(
        JSON.stringify({ error: "มีผู้ใช้นี้อยู่แล้ว (email/บัตร ปชช./userId ซ้ำ)" }),
        { status: 409 }
      );
    }

    const hashed = await bcrypt.hash(password, 10);

    // ✅ ทำงานแบบ atomic ใน transaction
    const created = await db.$transaction(async (tx) => {
      // 1) สร้าง profile (ยังไม่ผูกห้อง)
      const user = await tx.profile.create({
        data: {
          firstName,
          lastName,
          email,
          phone,
          birthday: new Date(birthday),
          address,
          nationalId,
          password: hashed,
          userId,
          role, // Prisma enum รับค่า "user" | "admin" ตรง ๆ ได้
        },
        select: { id: true, firstName: true, lastName: true, email: true },
      });

      // 2) ผูกห้องให้ผู้ใช้ + ตั้งค่าเริ่มต้น
      await tx.profile.update({
        where: { id: user.id },
        data: {
          roomId,                 
          roomStartDate: new Date(),
          isActive: true,
        },
      });

      // 3) อัปเดตสถานะห้อง
      await tx.room.update({
        where: { id: roomId },
        data: {
          status: "OCCUPIED",
          assignedAt: new Date(),
        },
      });

      return user;
    });

    return new Response(
      JSON.stringify({ message: "สมัครสมาชิกสำเร็จ", user: created }),
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return new Response(
      JSON.stringify({ error: "เกิดข้อผิดพลาดภายในระบบ" }),
      { status: 500 }
    );
  }
}
