// /app/api/profile/me/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/prisma";

/** ===== Runtime & Caching ===== */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

// กันแคชทั้งฝั่งเบราว์เซอร์และ CDN
const noStoreHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, private",
} as const;

export async function GET() {
  try {
    // ✅ เวอร์ชันของคุณต้อง await
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value ?? null;
    const role = cookieStore.get("role")?.value ?? null;

    if (!userId || role !== "user") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: noStoreHeaders }
      );
    }

    const user = await db.profile.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        birthday: true,
        address: true,
        nationalId: true,
        isActive: true,
        moveOutDate: true,
        roomStartDate: true,
        room: {
          select: {
            id: true,
            roomNumber: true,
            // status: true, // ต้องการสถานะห้องด้วยให้เปิด
          },
        },
        contracts: {
          orderBy: { startDate: "asc" }, // เก่า -> ใหม่
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
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404, headers: noStoreHeaders }
      );
    }

    // ให้ contractImages เป็น array เสมอ
    const contracts = (user.contracts ?? []).map((c) => ({
      ...c,
      contractImages: Array.isArray(c.contractImages) ? c.contractImages : [],
    }));

    return NextResponse.json(
      {
        ...user,
        contracts,
        roomId: user.room?.id ?? null,
        roomNumber: user.room?.roomNumber ?? null,
      },
      { headers: noStoreHeaders }
    );
  } catch (error) {
    console.error("💥 /api/profile/me error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: noStoreHeaders }
    );
  }
}
