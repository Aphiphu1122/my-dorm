// /app/api/profile/me/route.ts
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
        isActive: true,
        moveOutDate: true,
        roomStartDate: true,
        room: {
          select: {
            id: true,
            roomNumber: true,
            // ถ้าต้องการสถานะห้องด้วย ก็เปิดบรรทัดนี้
            // status: true,
          },
        },
        contracts: {
          orderBy: { startDate: "asc" }, // เรียงจากเก่า -> ใหม่
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

    // ให้ contractImages เป็น array เสมอ (กัน null)
    const contracts = (user.contracts ?? []).map((c) => ({
      ...c,
      contractImages: Array.isArray(c.contractImages) ? c.contractImages : [],
    }));

    return NextResponse.json({
      ...user,
      contracts,
      roomId: user.room?.id ?? null,
      roomNumber: user.room?.roomNumber ?? null,
    });
  } catch (error) {
    console.error("💥 /api/profile/me error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
