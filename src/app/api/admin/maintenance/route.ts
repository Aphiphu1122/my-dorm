// src/app/api/admin/maintenance/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { checkAdminAuthOrReject } from "@/lib/auth";

/** เส้นทางอาศัยคุกกี้ → กันแคชทั้งหมด */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
const noStore = {
  "Cache-Control": "no-store, no-cache, must-revalidate, private",
} as const;

/**
 * GET: รายการแจ้งซ่อมทั้งหมด (ล่าสุดก่อน) — สำหรับแอดมิน
 * คืน fields ที่จำเป็นต่อการแสดงผลในตาราง
 */
export async function GET() {
  // ✅ ตรวจสิทธิ์แอดมิน (ฟังก์ชันนี้จะคืน NextResponse 401 ถ้าไม่ผ่าน)
  const auth = await checkAdminAuthOrReject();
  if (auth instanceof NextResponse) {
    auth.headers.set("Cache-Control", noStore["Cache-Control"]);
    return auth;
  }

  try {
    const maintenanceRequests = await db.maintenanceRequest.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        description: true,
        status: true,      // PENDING | IN_PROGRESS | COMPLETED | CANCELED
        category: true,    // ตาม enum
        imageUrls: true,   // เผื่ออยากโชว์รูปตัวอย่าง
        createdAt: true,
        updatedAt: true,
        room: { select: { id: true, roomNumber: true } },
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return NextResponse.json(
      { maintenanceRequests },
      { status: 200, headers: noStore }
    );
  } catch (err) {
    console.error("[GET /api/admin/maintenance] error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500, headers: noStore }
    );
  }
}
