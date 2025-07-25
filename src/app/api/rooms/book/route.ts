import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function POST(req: Request) {
  const { roomId, userId } = await req.json();

  try {
    const updatedRoom = await db.room.update({
      where: { id: roomId },
      data: {
        status: "OCCUPIED",
        tenantId: userId,
      },
    });

    return NextResponse.json({ success: true, room: updatedRoom });
  } catch (error) {
    console.error("จองห้องไม่สำเร็จ:", error); // 👈 log ข้อผิดพลาด
    return NextResponse.json(
      { success: false, error: "จองห้องไม่สำเร็จ" },
      { status: 400 }
    );
  }
}
