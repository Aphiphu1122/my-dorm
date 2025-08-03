import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function GET() {
  try {
    // ✅ ตรวจสอบว่าเป็นแอดมินจาก cookie
    const cookieStore = await cookies();
    const role = cookieStore.get("role")?.value;

    if (role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ ดึงรายการแจ้งซ่อม (เรียงล่าสุดก่อน)
    const maintenanceRequests = await db.maintenanceRequest.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        description: true,
        status: true,
        category: true,
        createdAt: true,
        updatedAt: true,
        room: {
          select: {
            roomNumber: true,
          },
        },
      },
    });

    return NextResponse.json({ maintenanceRequests });
  } catch (err) {
    console.error("[GET /api/admin/maintenance]", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
