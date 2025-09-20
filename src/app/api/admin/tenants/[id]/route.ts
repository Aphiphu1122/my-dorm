// src/app/api/admin/tenants/[id]/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/prisma";
import { checkAdminAuthOrReject, getRoleFromCookie } from "@/lib/auth";
import { z } from "zod";

/** route นี้ผูก cookie → ปิด cache ทั้งหมด */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
const noStore = {
  "Cache-Control": "no-store, no-cache, must-revalidate, private",
} as const;

const ok = (data: unknown, status = 200) =>
  NextResponse.json({ success: true, ...(data as object) }, { status, headers: noStore });
const err = (message: string, status: number) =>
  NextResponse.json({ success: false, error: message }, { status, headers: noStore });

/* ----------------------------- Schemas ----------------------------- */
// ถ้า id เป็น UUID ในฐานข้อมูล แนะนำใช้ .uuid(); ถ้าไม่แน่ใจใช้ .min(1)
const ParamsSchema = z.object({ id: z.string().min(1) });

/* =============================== GET =============================== */
// GET /api/admin/tenants/[id]
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  // อนุญาตเฉพาะ admin
  const auth = await checkAdminAuthOrReject();
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = ParamsSchema.parse(params);

    const tenant = await db.profile.findUnique({
      where: { id },
      include: {
        room: {
          select: { id: true, roomNumber: true, status: true, assignedAt: true },
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

    if (!tenant) return err("ไม่พบผู้เช่า", 404);

    const latest = Array.isArray(tenant.contracts) && tenant.contracts.length > 0
      ? tenant.contracts[0]
      : null;

    // อนุญาตให้ “ต่อสัญญา” เมื่อสัญญาล่าสุดหมดอายุแล้ว (เทียบแบบ date)
    const now = new Date();
    const canRenew = latest?.endDate ? new Date(latest.endDate) <= now : false;

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
      status: tenant.room?.status ?? null,              // AVAILABLE | OCCUPIED | MAINTENANCE
      derivedStatus: tenant.room ? tenant.room.status : ("MOVEOUT" as const),
      roomStartDate: tenant.roomStartDate ?? null,
      assignedAt: tenant.room?.assignedAt ?? null,

      // สัญญาล่าสุด (flatten)
      contractId: latest?.id ?? null,
      contractStartDate: latest?.startDate ?? null,
      contractEndDate: latest?.endDate ?? null,
      contractDate: latest?.contractDate ?? null,
      rentPerMonth: latest?.rentPerMonth ?? null,
      contractImages: Array.isArray(latest?.contractImages) ? latest!.contractImages : [],

      // สัญญาทั้งหมด
      contracts: tenant.contracts.map((c) => ({
        id: c.id,
        startDate: c.startDate,
        endDate: c.endDate,
        rentPerMonth: c.rentPerMonth,
        contractImages: Array.isArray(c.contractImages) ? c.contractImages : [],
        dormOwnerName: c.dormOwnerName,
        dormAddress: c.dormAddress,
        contractDate: c.contractDate,
      })),

      // ตัวช่วย UI
      hasPendingMoveOut: tenant.moveOutRequests.length > 0,
      canRenew,
    };

    return ok({ user });
  } catch (e) {
    console.error("GET /api/admin/tenants/[id] error:", e);
    return err("เกิดข้อผิดพลาดภายในระบบ", 500);
  }
}

/* ============================== DELETE ============================== */
// DELETE /api/admin/tenants/[id]
// ลบผู้ใช้ได้เฉพาะกรณี “ไม่ได้เช่าอยู่” (ไม่มี roomId ผูกอยู่)
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  // อนุญาตเฉพาะ admin
  const role = await getRoleFromCookie();
  if (role !== "admin") return err("Unauthorized", 401);

  try {
    const { id } = ParamsSchema.parse(params);

    const tenant = await db.profile.findUnique({
      where: { id },
      select: {
        id: true,
        roomId: true,
        room: { select: { status: true } },
      },
    });

    if (!tenant) return err("ไม่พบผู้ใช้", 404);

    // บล็อกหากยังมีห้องอยู่/สถานะห้องเป็น OCCUPIED
    if (tenant.roomId || tenant.room?.status === "OCCUPIED") {
      return err("ไม่สามารถลบผู้ใช้ที่กำลังเช่าอยู่ได้", 400);
    }

    // ลบข้อมูลอ้างอิงในทรานแซกชันให้ปลอดภัย
    await db.$transaction(async (tx) => {
      await tx.contract.deleteMany({ where: { profileId: id } });
      await tx.bill.deleteMany({ where: { tenantId: id } });
      await tx.notification.deleteMany({ where: { userId: id } });
      await tx.maintenanceRequest.deleteMany({ where: { userId: id } });
      await tx.moveOutRequest.deleteMany({ where: { userId: id } });

      await tx.profile.delete({ where: { id } });
    });

    return ok({ message: "ลบผู้ใช้เรียบร้อย" });
  } catch (e) {
    console.error("DELETE /api/admin/tenants/[id] error:", e);
    return err("ไม่สามารถลบผู้ใช้ได้", 500);
  }
}
