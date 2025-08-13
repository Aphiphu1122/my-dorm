import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const prisma = new PrismaClient();

export async function getRoleFromCookie(): Promise<string | null> {
  const cookieStore = await cookies(); // ✅ แก้ไขตรงนี้
  return cookieStore.get("role")?.value || null;
}

export async function GET() {
  const role = await getRoleFromCookie();
if (role !== "admin") {
  return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
}

  try {
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

    // sync status ฝั่ง backend
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
  } catch (error) {
    console.error("❌ Failed to get rooms:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// 🟩 POST: เพิ่มห้องใหม่
export async function POST(req: NextRequest) {
  const role = await getRoleFromCookie();
  if (role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { roomNumber } = body;

    if (!roomNumber || typeof roomNumber !== "string") {
      return NextResponse.json({ error: "Invalid room number" }, { status: 400 });
    }

    const newRoom = await prisma.room.create({
      data: { roomNumber },
    });

    return NextResponse.json({ room: newRoom }, { status: 201 });
  } catch (error) {
    console.error("❌ Failed to create room:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
