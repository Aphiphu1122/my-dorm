import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const cookieStore = await cookies();
    const role = cookieStore.get("role")?.value;

    console.log("🔐 Role from cookie:", role);

    if (role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const roomsWithTenants = await prisma.room.findMany({
      where: {
        tenantId: {
          not: null,
        },
      },
      include: {
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            birthday: true,
            address: true,
            nationalId: true,
            userId: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        roomNumber: "asc",
      },
    });

    // ✅ รวม tenant กับเลขห้อง
    const users = roomsWithTenants
      .filter((room) => room.tenant !== null)
      .map((room) => ({
        ...room.tenant!,
        roomNumber: room.roomNumber,
      }));

    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    console.error("❌ Error fetching users:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
