// /api/admin/tenants/route.ts
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

    // 2) ดึงข้อมูล profile + room + สัญญาล่าสุด + สถานะคำร้องย้ายออก (เผื่อใช้)
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
        // สัญญาล่าสุด (เรียงตามวันเริ่มสัญญาใหม่สุด)
        contracts: {
          orderBy: { startDate: "desc" },
          take: 1,
          select: {
            id: true,
            startDate: true,
            endDate: true,
            rentPerMonth: true,
            contractDate: true,      // วันที่ทำสัญญาจริง
            contractImages: true,
          },
        },
        // เอาไว้เช็คว่ามีคำร้องย้ายออกที่ยังค้างอยู่ไหม
        moveOutRequests: {
          where: { status: "PENDING_APPROVAL" },
          select: { id: true },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 3) map payload ให้ frontend ใช้งานสะดวก
    const users = tenants.map((t) => {
      const latest =
        Array.isArray(t.contracts) && t.contracts.length > 0 ? t.contracts[0] : null;

      // ถ้าไม่มีห้อง ให้ตีความเป็น MOVEOUT (ไว้ใช้ใน UI โดยไม่แตะ enum เดิม)
      const derivedStatus = t.room ? t.room.status : ("MOVEOUT" as const);

      return {
        id: t.id,
        firstName: t.firstName,
        lastName: t.lastName,
        email: t.email,
        phone: t.phone,
        birthday: t.birthday,     // ISO string (NextResponse.json จะ serialize เป็น ISO ให้)
        address: t.address,
        nationalId: t.nationalId,
        userId: t.userId,
        isActive: t.isActive,

        // ห้อง
        roomId: t.room?.id ?? null,              // ✅ เพิ่มไว้ให้ใช้ต่อ (ต่อสัญญา/อ้างอิง)
        roomNumber: t.room?.roomNumber ?? null,
        status: t.room?.status ?? null,          // ค่าเดิม (AVAILABLE/OCCUPIED/MAINTENANCE)
        derivedStatus,                           // ✅ ถ้าไม่มีห้องจะแสดง MOVEOUT ได้ง่าย
        roomStartDate: t.roomStartDate ?? null,  // วันที่เข้าพักจริง
        assignedAt: t.room?.assignedAt ?? null,  // วันที่ระบบจัดสรรห้อง (แสดงว่า "กำหนดห้องเมื่อไหร่")

        // สัญญาล่าสุด
        contractId: latest?.id ?? null,
        contractStartDate: latest?.startDate ?? null,
        contractEndDate: latest?.endDate ?? null,
        contractDate: latest?.contractDate ?? null, // วันที่ทำสัญญาจริง
        rentPerMonth: latest?.rentPerMonth ?? null,
        contractImages: latest?.contractImages ?? [],

        // สถานะคำร้องย้ายออกที่ยังค้าง
        hasPendingMoveOut: t.moveOutRequests.length > 0,
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
