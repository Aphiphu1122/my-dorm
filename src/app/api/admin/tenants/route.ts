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

    // 2) ดึงข้อมูล profile + room + สัญญาล่าสุด
    const tenants = await db.profile.findMany({
      where: { role: "user" },
      include: {
        room: {
          select: {
            id: true,
            roomNumber: true,
            status: true,
            assignedAt: true,
          },
        },
        contracts: {
          orderBy: { startDate: "desc" }, // หรือจะสลับเป็น contractDate ก็ได้ ถ้าต้องการเรียงตามวันเซ็นจริง
          take: 1,
          select: {
            id: true,
            startDate: true,
            endDate: true,
            rentPerMonth: true,
            contractDate: true,       // ✅ เพิ่ม field วันทำสัญญาจริง
            contractImages: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 3) map เป็น payload ที่ frontend ใช้งานสะดวก
    const users = tenants.map((t) => {
      const latest = Array.isArray(t.contracts) && t.contracts.length > 0 ? t.contracts[0] : null;

      // สถานะให้ใช้งานสะดวกขึ้น: ถ้าไม่มีห้องถือว่า MOVEOUT
      const derivedStatus = t.room ? t.room.status : ("MOVEOUT" as const);

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
        status: t.room?.status ?? null,        // คงค่าดั้งเดิมไว้
        derivedStatus,                         // ✅ เพิ่มให้เลือกใช้
        roomStartDate: t.roomStartDate ?? null, // ใช้เป็น "วันที่เข้าพักจริง"
        assignedAt: t.room?.assignedAt ?? null,

        // สัญญา
        contractId: latest?.id ?? null,
        contractStartDate: latest?.startDate ?? null,
        contractEndDate: latest?.endDate ?? null,
        contractDate: latest?.contractDate ?? null, // ✅ วันทำสัญญาจริง
        rentPerMonth: latest?.rentPerMonth ?? null,
        contractImages: latest?.contractImages ?? [],
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
