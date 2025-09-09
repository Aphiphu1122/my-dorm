// src/app/api/profile/change-password/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z
  .object({
    oldPassword: z
      .string()
      .trim()
      .min(6, "รหัสผ่านเดิมควรมีอย่างน้อย 6 ตัวอักษร"),
    newPassword: z
      .string()
      .trim()
      .min(6, "รหัสผ่านใหม่ควรมีอย่างน้อย 6 ตัวอักษร"),
    confirmPassword: z.string().trim(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "รหัสผ่านใหม่ไม่ตรงกัน",
    path: ["confirmPassword"],
  });

export async function PATCH(req: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { oldPassword, newPassword } = parsed.data;

    const user = await db.profile.findUnique({
      where: { id: userId },
      select: { id: true, password: true },
    });

    if (!user || !user.password) {
      return NextResponse.json({ error: "ไม่พบผู้ใช้งาน" }, { status: 404 });
    }

    // ✅ ตรวจสอบ oldPassword
    const isValid = await bcrypt.compare(oldPassword, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: { oldPassword: ["รหัสผ่านเดิมไม่ถูกต้อง"] } },
        { status: 400 }
      );
    }

    // ✅ ป้องกัน newPassword ซ้ำกับ oldPassword
    const isSameAsOld = await bcrypt.compare(newPassword, user.password);
    if (isSameAsOld || oldPassword === newPassword) {
      return NextResponse.json(
        { error: { newPassword: ["รหัสผ่านใหม่ต้องแตกต่างจากรหัสผ่านเดิม"] } },
        { status: 400 }
      );
    }

    const hashed = await bcrypt.hash(newPassword, 12);

    await db.profile.update({
      where: { id: userId },
      data: { password: hashed },
    });

    return NextResponse.json({ message: "เปลี่ยนรหัสผ่านสำเร็จ" });
  } catch (err) {
    console.error("💥 Error changing password:", err);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" },
      { status: 500 }
    );
  }
}
