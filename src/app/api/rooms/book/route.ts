import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function POST(req: Request) {
  const { roomId, userId } = await req.json();

  try {
    const [updatedProfile, updatedRoom] = await db.$transaction([
      db.profile.update({
        where: { id: userId },
        data: {
          roomId,
          roomStartDate: new Date(),
          isActive: true,
        },
      }),
      db.room.update({
        where: { id: roomId },
        data: {
          status: "OCCUPIED",
          assignedAt: new Date(),
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      room: updatedRoom,
      profile: updatedProfile,
    });
  } catch (error) {
    console.error("จองห้องไม่สำเร็จ:", error);
    return NextResponse.json(
      { success: false, error: "จองห้องไม่สำเร็จ" },
      { status: 400 }
    );
  }
}
