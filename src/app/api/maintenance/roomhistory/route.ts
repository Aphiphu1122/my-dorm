// src/app/api/maintenance/roomhistory/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromCookie } from "@/lib/auth";
import { db } from "@/lib/prisma";

/** เส้นทางที่อิงคุกกี้ → กันแคชทั้งหมด */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
const noStore = {
  "Cache-Control": "no-store, no-cache, must-revalidate, private",
} as const;

// ✅ ดึงประวัติแจ้งซ่อมของผู้ใช้ (ใหม่สุดก่อน) + รองรับ ?limit= จำนวนรายการ (default 20)
export async function GET(req: NextRequest) {
  try {
    const userId = await getUserIdFromCookie();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: noStore }
      );
    }

    // อ่าน query param: limit (1..100)
    const url = new URL(req.url);
    const limitRaw = url.searchParams.get("limit");
    let take = Number.parseInt(limitRaw || "20", 10);
    if (!Number.isFinite(take) || take < 1) take = 20;
    if (take > 100) take = 100;

    const requests = await db.maintenanceRequest.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take,
      select: {
        id: true,
        category: true,       
        status: true,          
        description: true,     
        imageUrls: true,       
        createdAt: true,
        updatedAt: true,
        room: {                
          select: { roomNumber: true },
        },
      },
    });

    return NextResponse.json({ requests }, { status: 200, headers: noStore });
  } catch (err) {
    console.error("[GET /api/maintenance/roomhistory] error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500, headers: noStore }
    );
  }
}
