// src/app/api/profile/update/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
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
    const { firstName, lastName, phone, birthday, address } = body ?? {};

    // ตรวจความครบ/ถูกต้อง
    if (!firstName || !lastName || !phone || !birthday || !address) {
      return NextResponse.json({ error: "กรอกข้อมูลไม่ครบถ้วน" }, { status: 400 });
    }
    const bday = new Date(birthday);
    if (isNaN(bday.getTime())) {
      return NextResponse.json({ error: "รูปแบบวันเกิดไม่ถูกต้อง" }, { status: 400 });
    }

    const updated = await db.profile.update({
      where: { id: userId },
      data: {
        firstName: String(firstName).trim(),
        lastName: String(lastName).trim(),
        phone: String(phone),
        birthday: bday,
        address: String(address).trim(),
        updatedAt: new Date(),
      },
      // เลือกฟิลด์ที่ FE ต้องใช้ และดึงสัญญาเรียงตามเวลา
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        birthday: true,
        address: true,
        nationalId: true,
        isActive: true,
        moveOutDate: true,
        room: { select: { id: true, roomNumber: true } },
        contracts: {
          orderBy: { startDate: "asc" },
          select: {
            id: true,
            startDate: true,
            endDate: true,
            rentPerMonth: true,
            contractImages: true,
            dormOwnerName: true,
            dormAddress: true,
            contractDate: true,
          },
        },
      },
    });

    // ให้ contractImages เป็น array เสมอ
    const contracts = (updated.contracts ?? []).map((c) => ({
      ...c,
      contractImages: Array.isArray(c.contractImages) ? c.contractImages : [],
    }));

    return NextResponse.json({
      message: "อัปเดตสำเร็จ",
      user: {
        ...updated,
        contracts,
        roomId: updated.room?.id ?? null,
        roomNumber: updated.room?.roomNumber ?? null,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในระบบ" }, { status: 500 });
  }
}
