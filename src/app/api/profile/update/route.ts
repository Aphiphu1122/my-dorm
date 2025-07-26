import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";

const prisma = new PrismaClient();

export async function PUT(req: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;
    const role = cookieStore.get("role")?.value;

    if (!userId || role !== "user") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      firstName,
      lastName,
      phone,
      birthday,
      address,
    } = body;

    const updated = await prisma.profile.update({
      where: { userId },
      data: {
        firstName,
        lastName,
        phone,
        birthday,
        address,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ message: "อัปเดตสำเร็จ", user: updated });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
