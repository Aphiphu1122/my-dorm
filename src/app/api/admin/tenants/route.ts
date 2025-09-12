import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getRoleFromCookie } from "@/lib/auth";

export async function GET() {
  try {
    // 1) ตรวจสิทธิ์ ต้องเป็น admin
    const role = await getRoleFromCookie();
    if (role !== "admin") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 2) ดึงข้อมูล profile + room + contracts (เอาล่าสุด)
    const tenants = await db.profile.findMany({
      where: { role: "user" },
      include: {
        room: true,
        contracts: {
          orderBy: { startDate: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 3) แปลงรูปแบบข้อมูลให้ frontend ใช้งานง่าย
    const users = tenants.map((t) => {
      // เอาสัญญาล่าสุด
      const latestContract =
        Array.isArray(t.contracts) && t.contracts.length > 0
          ? t.contracts[0]
          : null;

      return {
        id: t.id,
        firstName: t.firstName,
        lastName: t.lastName,
        email: t.email,
        phone: t.phone,
        birthday: t.birthday,
        address: t.address,
        nationalId: t.nationalId,
        userId: t.userId,
        // ห้อง
        roomNumber: t.room?.roomNumber ?? null,
        status: t.room?.status ?? null,
        roomStartDate: t.roomStartDate ?? null,
        assignedAt: t.room?.assignedAt ?? null,
        // สัญญา
        contractStartDate: latestContract?.startDate ?? null,
        contractEndDate: latestContract?.endDate ?? null,
        rentPerMonth: latestContract?.rentPerMonth ?? null,
        contractId: latestContract?.id ?? null,
        contractImages: latestContract?.contractImages ?? [],
      };
    });

    // 4) ส่งข้อมูลออก
    return NextResponse.json({ success: true, users }, { status: 200 });
  } catch (err) {
    console.error("GET /api/admin/tenants error:", err);
    return NextResponse.json(
      { success: false, error: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 }
    );
  }
}
