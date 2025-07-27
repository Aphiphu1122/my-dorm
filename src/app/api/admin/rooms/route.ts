import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const prisma = new PrismaClient();

export async function GET() {
    const cookieStore = await cookies();
    const role = cookieStore.get("role")?.value;
  if (role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

    const rooms = await prisma.room.findMany({
    include: {
      tenant: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: { roomNumber: "asc" },
  });

    // Sync สถานะให้ status = MAINTENANCE หากมีอยู่, ถ้าไม่ก็เช็คจาก tenant
  const updatedRooms = rooms.map((room) => ({
    ...room,
    status:
      room.status === "MAINTENANCE"
        ? "MAINTENANCE"
        : room.tenant
        ? "OCCUPIED"
        : "AVAILABLE",
  }));

return NextResponse.json({ rooms: updatedRooms });
}

export async function POST(req: NextRequest) {
    const cookieStore = await cookies();
    const role = cookieStore.get("role")?.value;
  if (role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();
  const { roomNumber } = body;

  if (!roomNumber || typeof roomNumber !== "string") {
    return NextResponse.json({ error: "Invalid room number" }, { status: 400 });
  }

  const newRoom = await prisma.room.create({
    data: { roomNumber },
  });

  return NextResponse.json({ room: newRoom }, { status: 201 });
}
