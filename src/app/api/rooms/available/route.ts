import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function GET() {
  const availableRooms = await db.room.findMany({
    where: {
      status: "AVAILABLE",
    },
    orderBy: {
      roomNumber: "asc",
    },
  });

  return NextResponse.json({ rooms: availableRooms });
}
