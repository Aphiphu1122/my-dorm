import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;
    const role = cookieStore.get("role")?.value;

    // ✅ log userId และ role ออกมา
    console.log("🍪 Cookie userId:", userId);
    console.log("🍪 Cookie role:", role);

    if (!userId || role !== "user") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.profile.findUnique({
      where: { userId },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        birthday: true,
        address: true,
        nationalId: true,
        room: {
          select: { roomNumber: true },
        },
      },
    });

    if (!user) {
      console.log("❌ ไม่พบผู้ใช้ในฐานข้อมูลสำหรับ userId:", userId);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("❌ Fetch profile error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
