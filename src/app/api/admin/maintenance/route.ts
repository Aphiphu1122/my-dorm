import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/authMiddleware";

export async function GET(_req: NextRequest) {
  // ✅ 1. ตรวจสอบสิทธิ์ว่าเป็น admin หรือไม่
  const userIdOrResponse = await checkAdminAuth();
  if (userIdOrResponse instanceof NextResponse) return userIdOrResponse;

  try {
    // ✅ 2. ดึงรายการแจ้งซ่อมทั้งหมด พร้อมข้อมูลห้องและผู้แจ้ง
    const requests = await db.maintenanceRequest.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        room: {
          select: {
            id: true,
            roomNumber: true,
            status: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    // ✅ 3. ส่งกลับข้อมูล
    return NextResponse.json({ requests });
  } catch (err) {
    console.error("[GET /api/admin/maintenance]", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
