import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const prisma = new PrismaClient();

// GET room by ID
export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
    const cookieStore = await cookies();
    const role = cookieStore.get("role")?.value;
  if (role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const room = await prisma.room.findUnique({
    where: { id: params.id },
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
  });

  if (!room) return NextResponse.json({ error: "ไม่พบห้อง" }, { status: 404 });
  return NextResponse.json({ room });
}

// PATCH update room
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const cookieStore = await cookies();
    const role = cookieStore.get("role")?.value;
  if (role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await req.json();
  const { roomNumber, status } = body;

  const updatedRoom = await prisma.room.update({
    where: { id: params.id },
    data: {
      ...(roomNumber && { roomNumber }),
      ...(status && { status }),
    },
  });

  return NextResponse.json({ room: updatedRoom });
}

// DELETE room
export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
    const cookieStore = await cookies();
    const role = cookieStore.get("role")?.value;
  if (role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  await prisma.room.delete({ where: { id: params.id } });
  return NextResponse.json({ message: "ลบห้องสำเร็จ" });
}
