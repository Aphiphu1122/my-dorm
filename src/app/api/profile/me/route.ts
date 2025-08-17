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
        room: {
          select: {
            id: true,
            roomNumber: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...user,
      roomId: user.room?.id ?? null,
      roomNumber: user.room?.roomNumber ?? null,
    });
  } catch (error) {
    console.error("💥 Server error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
