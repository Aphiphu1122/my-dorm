// src/app/api/notifications/[id]/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getUserIdFromCookie } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserIdFromCookie();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    const updated = await db.notification.updateMany({
      where: { id, userId },
      data: { read: true },
    });

    return NextResponse.json({ success: true, updated });
  } catch (error) {
    console.error("Mark notification as read error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
