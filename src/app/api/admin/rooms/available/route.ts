// src/app/api/admin/rooms/available/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/prisma";
import { checkAdminAuthOrReject } from "@/lib/auth";

// เส้นทางนี้อาศัยคุกกี้ → ปิดแคชทั้งหมด
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
const noStore = {
  "Cache-Control": "no-store, no-cache, must-revalidate, private",
} as const;

export async function GET(req: NextRequest) {
  // 🔐 ตรวจสิทธิ์แอดมิน
  const auth = await checkAdminAuthOrReject();
  if (auth instanceof NextResponse) {
    auth.headers.set("Cache-Control", noStore["Cache-Control"]);
    return auth;
  }

  // คำค้นเลือกได้ (เช่น 101, 202)
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim();

  // ห้องที่ “ว่างจริง”: ไม่อยู่สถานะซ่อมบำรุง และไม่มี tenant ผูกอยู่
  // (เรายังคืนห้องที่ตั้ง status = "AVAILABLE" อัตโนมัติด้วย)
  const rooms = await db.room.findMany({
    where: {
      status: { not: "MAINTENANCE" },
      tenant: { is: null }, // ป้องกันห้องที่ยังมีผู้เช่าเกาะอยู่
      ...(q ? { roomNumber: { contains: q, mode: "insensitive" } } : {}),
    },
    orderBy: { roomNumber: "asc" },
    select: { id: true, roomNumber: true, status: true },
  });

  return NextResponse.json(
    { success: true, rooms },
    { status: 200, headers: noStore }
  );
}
