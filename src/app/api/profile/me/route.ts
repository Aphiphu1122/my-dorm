import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET() {
  try {
    // ดึง cookies จาก request
    const cookieStore = await cookies()
    const userId = cookieStore.get("userId")?.value
    const role = cookieStore.get("role")?.value

    console.log("🍪 Raw Cookie userId:", userId);
    console.log("🍪 Raw Cookie role:", role);
    console.log("📏 typeof userId:", typeof userId);
    console.log("📏 JSON.stringify(userId):", JSON.stringify(userId));

    if (!userId || role !== "user") {
      console.log("❌ ไม่ผ่าน auth check");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 🧠 Debugก่อน query
    console.log("🔍 กำลังค้นหาผู้ใช้ใน DB ด้วย userId:", userId);

    const user = await prisma.profile.findUnique({
  where: { id: userId },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        birthday: true,
        address: true,
        nationalId: true,
        room: {
          select: {
            roomNumber: true,
          },
        },
      },
    });

    if (!user) {
      console.log("❌ ไม่พบข้อมูลผู้ใช้ใน DB:", userId);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("✅ พบผู้ใช้ใน DB:", user);

    return NextResponse.json({ user });
  } catch (error) {
    console.error("💥 Server error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}