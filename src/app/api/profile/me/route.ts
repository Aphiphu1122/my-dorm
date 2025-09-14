// src/app/api/profile/me/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/prisma";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;
    const role = cookieStore.get("role")?.value;

    if (!userId || role !== "user") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
        roomStartDate: true,
        room: {
          select: {
            id: true,
            roomNumber: true,
          },
        },
        // ✅ ดึงสัญญาของผู้ใช้ (ล่าสุดก่อน)
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
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ส่งคืนทั้งรูปแบบเดิม (roomId/roomNumber บนสุด) และ object room + contracts
    return NextResponse.json({
      ...user,
      roomId: user.room?.id ?? null,
      roomNumber: user.room?.roomNumber ?? null,
    });
  } catch (error) {
    console.error("💥 /api/profile/me error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
