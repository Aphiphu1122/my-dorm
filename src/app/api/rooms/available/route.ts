import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getRoleFromCookie } from "@/lib/auth";

export async function GET() {
  try {
    const role = await getRoleFromCookie();
    if (role !== "admin") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const rooms = await db.room.findMany({
      where: { status: "AVAILABLE" },
      select: { id: true, roomNumber: true },
      orderBy: { roomNumber: "asc" },
    });

    return NextResponse.json({ rooms });
  } catch (err) {
    console.error("GET /admin/rooms/available error:", err);
    return NextResponse.json(
      { success: false, error: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 }
    );
  }
}
