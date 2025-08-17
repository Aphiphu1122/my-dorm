// src/app/api/profile/change-password/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  oldPassword: z.string().min(6, "กรุณากรอกรหัสผ่านเดิม"),
  newPassword: z.string().min(6, "รหัสผ่านใหม่ควรมีอย่างน้อย 6 ตัวอักษร"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "รหัสผ่านใหม่ไม่ตรงกัน",
  path: ["confirmPassword"],
});

export async function PATCH(req: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;
    const role = cookieStore.get("role")?.value;

    if (!userId || role !== "user") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { oldPassword, newPassword } = parsed.data;

    const user = await db.profile.findUnique({ where: { id: userId } });

    if (!user) {
      return NextResponse.json({ error: "ไม่พบผู้ใช้งาน" }, { status: 404 });
    }

    const isValid = await bcrypt.compare(oldPassword, user.password);
    if (!isValid) {
      return NextResponse.json({ error: { oldPassword: ["รหัสผ่านเดิมไม่ถูกต้อง"] } }, { status: 400 });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await db.profile.update({
      where: { id: userId },
      data: { password: hashed },
    });

    return NextResponse.json({ message: "เปลี่ยนรหัสผ่านสำเร็จ" });
  } catch (err) {
    console.error("💥 Error changing password:", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 });
  }
}
