// src/app/api/admin/active-tenants/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { checkAdminAuthOrReject } from "@/lib/auth";

/** เส้นทางนี้ผูกกับคุกกี้ → กันแคชทั้งหมด */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
const noStore = {
  "Cache-Control": "no-store, no-cache, must-revalidate, private",
} as const;

export async function GET() {
  try {
    // ✅ ตรวจสิทธิ์แอดมิน (คืน NextResponse เมื่อไม่ผ่าน)
    const auth = await checkAdminAuthOrReject();
    if (auth instanceof NextResponse) {
      auth.headers.set("Cache-Control", noStore["Cache-Control"]);
      return auth;
    }

    // ✅ ดึงเฉพาะห้องที่มีผู้เช่าอยู่ (สถานะ OCCUPIED + มี tenant)
    const rooms = await db.room.findMany({
      where: {
        status: "OCCUPIED",
        tenant: { isNot: null }, // ถ้า schema ใช้ tenantId ให้เปลี่ยนเป็น { NOT: { tenantId: null } }
      },
      include: {
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        bills: {
          orderBy: { billingMonth: "desc" },
          take: 1,
          select: {
            waterCurr: true,     
            electricCurr: true,  
          },
        },
      },
    });

    const result = rooms.map((room) => {
      const lastBill = room.bills?.[0];
      return {
        id: room.id,
        roomNumber: room.roomNumber,
        tenantId: room.tenant?.id ?? null,
        tenant: room.tenant,
        lastWater: lastBill?.waterCurr ?? 0,
        lastElectric: lastBill?.electricCurr ?? 0,
      };
    });

    return NextResponse.json(result, { status: 200, headers: noStore });
  } catch (err) {
    console.error("💥 GET /api/admin/active-tenants error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500, headers: noStore }
    );
  }
}
