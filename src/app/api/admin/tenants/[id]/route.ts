import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getRoleFromCookie } from "@/lib/auth";

// GET /api/admin/tenants/[id]
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1) ตรวจสิทธิ์ admin
    const role = await getRoleFromCookie();
    if (role !== "admin") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const tenantId = params.id;

    // 2) ดึงข้อมูล profile + room + contracts ทั้งหมด
    const tenant = await db.profile.findUnique({
      where: { id: tenantId },
      include: {
        room: true,
        contracts: {
          orderBy: { startDate: "desc" },
        },
      },
    });

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: "ไม่พบผู้เช่า" },
        { status: 404 }
      );
    }

    // 3) เตรียมข้อมูลตอบกลับ
    const latestContract =
      Array.isArray(tenant.contracts) && tenant.contracts.length > 0
        ? tenant.contracts[0]
        : null;

    const user = {
      id: tenant.id,
      firstName: tenant.firstName,
      lastName: tenant.lastName,
      email: tenant.email,
      phone: tenant.phone,
      birthday: tenant.birthday,
      address: tenant.address,
      nationalId: tenant.nationalId,
      userId: tenant.userId,
      role: tenant.role,
      isActive: tenant.isActive,
      // ห้อง
      roomNumber: tenant.room?.roomNumber ?? null,
      status: tenant.room?.status ?? null,
      roomStartDate: tenant.roomStartDate ?? null,
      assignedAt: tenant.room?.assignedAt ?? null,
      // สัญญา (ฉบับล่าสุด)
      contractStartDate: latestContract?.startDate ?? null,
      contractEndDate: latestContract?.endDate ?? null,
      rentPerMonth: latestContract?.rentPerMonth ?? null,
      contractId: latestContract?.id ?? null,
      contractImages: latestContract?.contractImages ?? [],
      // สัญญาทั้งหมด
      contracts: tenant.contracts.map((c) => ({
        id: c.id,
        startDate: c.startDate,
        endDate: c.endDate,
        rentPerMonth: c.rentPerMonth,
        contractImages: c.contractImages,
        dormOwnerName: c.dormOwnerName,
        dormAddress: c.dormAddress,
        contractDate: c.contractDate,
      })),
    };

    // 4) ส่งกลับ
    return NextResponse.json({ success: true, user }, { status: 200 });
  } catch (err) {
    console.error("GET /api/admin/tenants/[id] error:", err);
    return NextResponse.json(
      { success: false, error: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 }
    );
  }
}
