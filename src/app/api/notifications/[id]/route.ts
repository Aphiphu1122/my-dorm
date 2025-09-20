// src/app/api/notifications/[id]/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getUserIdFromCookie } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
const noStore = {
  "Cache-Control": "no-store, no-cache, must-revalidate, private",
} as const;

export async function PATCH(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserIdFromCookie();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: noStore });
    }

    const id = params?.id;
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400, headers: noStore });
    }

    // ใช้ updateMany เพื่อไม่ throw ถ้าไม่พบ (จะได้ count=0)
    const updated = await db.notification.updateMany({
      where: { id, userId },
      data: { read: true },
    });

    if (updated.count === 0) {
      // ไม่พบแจ้งเตือนนี้ หรือไม่ใช่ของผู้ใช้
      return NextResponse.json({ error: "Not found" }, { status: 404, headers: noStore });
    }

    return NextResponse.json({ success: true, updated }, { status: 200, headers: noStore });
  } catch (error) {
    console.error("Mark notification as read error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500, headers: noStore });
  }
}
