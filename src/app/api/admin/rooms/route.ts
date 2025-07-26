import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const cookieStore = await cookies();
    const role = cookieStore.get("role")?.value;

    console.log("🎫 Role from cookie:", role);

     console.log("🎫 Role from cookie:", role);

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

    console.log("📦 Rooms:", rooms); // ✅ ลองเพิ่ม log นี้เพื่อตรวจดูว่าได้ข้อมูลไหม

    return NextResponse.json(rooms);
  } catch (err: unknown) {
    console.error("เกิดข้อผิดพลาด:", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

