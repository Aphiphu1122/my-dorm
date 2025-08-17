// src/app/api/profile/update/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/prisma"; // ✅ แนะนำให้ใช้ db จาก lib แทน new PrismaClient()
import { cookies } from "next/headers";

export async function PUT(req: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;
    const role = cookieStore.get("role")?.value;

    if (!userId || role !== "user") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { firstName, lastName, phone, birthday, address } = body;

    // ตรวจสอบว่าค่าที่รับมาครบและถูกต้อง
    if (!firstName || !lastName || !phone || !birthday || !address) {
      return NextResponse.json(
        { error: "กรอกข้อมูลไม่ครบถ้วน" },
        { status: 400 }
      );
    }

      const updated = await db.profile.update({
        where: { id: userId },
        data: {
          firstName,
          lastName,
          phone,
          birthday: new Date(birthday),
          address,
          updatedAt: new Date(),
        },
        include: {
          room: true,
        },
      });

    return NextResponse.json({ message: "อัปเดตสำเร็จ", user: updated });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 }
    );
  }
}
