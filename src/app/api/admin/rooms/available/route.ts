import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getRoleFromCookie } from "@/lib/auth";

export async function GET() {
  const role = await getRoleFromCookie();
  if (role !== "admin") return new NextResponse("Unauthorized", { status: 401 });

  const rooms = await db.room.findMany({
    where: { status: "AVAILABLE" },
    orderBy: { roomNumber: "asc" },
    select: { id: true, roomNumber: true },
  });
  return NextResponse.json({ success: true, rooms });
}
