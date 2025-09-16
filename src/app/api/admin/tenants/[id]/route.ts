// /api/admin/tenants/[id]/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getRoleFromCookie } from "@/lib/auth";

// GET /api/admin/tenants/[id]
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const role = await getRoleFromCookie();
    if (role !== "admin") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const tenantId = params.id;

    const tenant = await db.profile.findUnique({
      where: { id: tenantId },
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
          orderBy: { startDate: "desc" },
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
        moveOutRequests: {
          where: { status: "PENDING_APPROVAL" },
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: "ไม่พบผู้เช่า" },
        { status: 404 }
      );
    }

    const latest =
      Array.isArray(tenant.contracts) && tenant.contracts.length > 0
        ? tenant.contracts[0]
        : null;

    // อนุญาตให้ “ต่อสัญญา” ได้เมื่อสัญญาล่าสุดหมดอายุแล้ว
    const canRenew =
      latest?.endDate ? new Date(latest.endDate) <= new Date() : false;

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
      roomId: tenant.room?.id ?? null,
      roomNumber: tenant.room?.roomNumber ?? null,
      status: tenant.room?.status ?? null,        // AVAILABLE | OCCUPIED | MAINTENANCE
      derivedStatus: tenant.room ? tenant.room.status : ("MOVEOUT" as const),
      roomStartDate: tenant.roomStartDate ?? null, // วันที่เข้าพักจริง
      assignedAt: tenant.room?.assignedAt ?? null, // “วันที่กำหนดห้องให้” (label ฝั่ง UI)

      // สัญญาล่าสุด (flatten)
      contractId: latest?.id ?? null,
      contractStartDate: latest?.startDate ?? null,
      contractEndDate: latest?.endDate ?? null,
      contractDate: latest?.contractDate ?? null, // วันที่ทำสัญญาจริง
      rentPerMonth: latest?.rentPerMonth ?? null,
      contractImages: latest?.contractImages ?? [],

      // สัญญาทั้งหมด (แสดงเป็นรายการในหน้า)
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

      // ตัวช่วย UI
      hasPendingMoveOut: tenant.moveOutRequests.length > 0,
      canRenew,
    };

    return NextResponse.json({ success: true, user }, { status: 200 });
  } catch (err) {
    console.error("GET /api/admin/tenants/[id] error:", err);
    return NextResponse.json(
      { success: false, error: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/tenants/[id]
// ลบผู้ใช้ได้เฉพาะกรณี “ไม่ได้เช่าอยู่” (ไม่มี roomId ผูกอยู่)
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const role = await getRoleFromCookie();
    if (role !== "admin") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const tenantId = params.id;

    const tenant = await db.profile.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        roomId: true,
        room: { select: { status: true } },
      },
    });

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: "ไม่พบผู้ใช้" },
        { status: 404 }
      );
    }

    // บล็อคการลบ หากยังมีห้องอยู่หรือสถานะห้องเป็น OCCUPIED
    if (tenant.roomId || tenant.room?.status === "OCCUPIED") {
      return NextResponse.json(
        { success: false, error: "ไม่สามารถลบผู้ใช้ที่กำลังเช่าอยู่ได้" },
        { status: 400 }
      );
    }

    // ลบข้อมูลที่อ้างอิงแบบปลอดภัยในทรานแซกชัน
    await db.$transaction(async (tx) => {
      await tx.contract.deleteMany({ where: { profileId: tenantId } });
      await tx.bill.deleteMany({ where: { tenantId } });
      await tx.notification.deleteMany({ where: { userId: tenantId } });
      await tx.maintenanceRequest.deleteMany({ where: { userId: tenantId } });
      await tx.moveOutRequest.deleteMany({ where: { userId: tenantId } });

      await tx.profile.delete({ where: { id: tenantId } });
    });

    return NextResponse.json(
      { success: true, message: "ลบผู้ใช้เรียบร้อย" },
      { status: 200 }
    );
  } catch (err) {
    console.error("DELETE /api/admin/tenants/[id] error:", err);
    return NextResponse.json(
      { success: false, error: "ไม่สามารถลบผู้ใช้ได้" },
      { status: 500 }
    );
  }
}
