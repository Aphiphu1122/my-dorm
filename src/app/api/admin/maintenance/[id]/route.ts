// src/app/api/admin/maintenance/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { checkAdminAuthOrReject } from "@/lib/auth";
import { z } from "zod";
import { MaintenanceStatus } from "@prisma/client";

/** เส้นทางนี้อาศัยคุกกี้ → ปิดแคชทั้งหมด */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
const noStore = {
  "Cache-Control": "no-store, no-cache, must-revalidate, private",
} as const;

/* ---------------- Zod ----------------
   รับได้ทั้ง CANCEL (ของ Prisma เดิม) และ CANCELED (ที่บางจุดสะกดแบบนี้) */
const PatchSchema = z.object({
  status: z.enum([
    "PENDING",
    "IN_PROGRESS",
    "COMPLETED",
    "CANCEL",    // <-- ของ Prisma
    "CANCELED",  // <-- เขียนเผื่อเข้ามาแบบนี้
  ]),
});

type AnyStatus =
  | MaintenanceStatus      // "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCEL"
  | "CANCELED";            // รองรับ input จาก FE

/* =============================== GET =============================== */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await checkAdminAuthOrReject();
  if (auth instanceof NextResponse) {
    auth.headers.set("Cache-Control", noStore["Cache-Control"]);
    return auth;
  }

  try {
    const requestId = params.id;

    const request = await db.maintenanceRequest.findUnique({
      where: { id: requestId },
      include: {
        room: { select: { id: true, roomNumber: true } },
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true },
        },
      },
    });

    if (!request) {
      return NextResponse.json(
        { error: "Maintenance request not found" },
        { status: 404, headers: noStore }
      );
    }

    return NextResponse.json({ request }, { status: 200, headers: noStore });
  } catch (error) {
    console.error("[GET /api/admin/maintenance/[id]]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500, headers: noStore }
    );
  }
}

/* ============================== PATCH ============================== */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await checkAdminAuthOrReject();
  if (auth instanceof NextResponse) {
    auth.headers.set("Cache-Control", noStore["Cache-Control"]);
    return auth;
  }

  try {
    const requestId = params.id;
    const body = await req.json();
    const parsed = PatchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400, headers: noStore }
      );
    }

    const incoming = parsed.data.status as AnyStatus;

    // ✅ map ให้ DB เสมอเป็น enum ของ Prisma (CANCELED → CANCEL)
    const persistStatus: MaintenanceStatus =
      incoming === "CANCELED" ? MaintenanceStatus.CANCEL : (incoming as MaintenanceStatus);

    const request = await db.maintenanceRequest.findUnique({
      where: { id: requestId },
      select: { id: true, userId: true, status: true },
    });
    if (!request) {
      return NextResponse.json(
        { error: "Maintenance request not found" },
        { status: 404, headers: noStore }
      );
    }

    if (request.status === persistStatus) {
      // ไม่เปลี่ยนสถานะ -> ไม่ต้อง update
      return NextResponse.json(
        { success: true, updated: { id: request.id, status: request.status } },
        { status: 200, headers: noStore }
      );
    }

    const updated = await db.maintenanceRequest.update({
      where: { id: requestId },
      data: { status: persistStatus },
      select: { id: true, status: true, updatedAt: true },
    });

    // ✅ แจ้งเตือนผู้เช่าเมื่อเสร็จสิ้นหรือยกเลิก (รองรับ input ทั้ง CANCEL/CANCELED)
    const shouldNotify =
      incoming === "COMPLETED" || incoming === "CANCELED" || incoming === "CANCEL";

    if (shouldNotify) {
      await db.notification.create({
        data: {
          userId: request.userId,
          message:
            incoming === "COMPLETED"
              ? "📢 คำร้องแจ้งซ่อมของคุณได้รับการแก้ไขเรียบร้อยแล้ว ✅"
              : "📢 คำร้องแจ้งซ่อมของคุณถูกยกเลิก ❌",
          type: "MAINTENANCE",
        },
      });
    }

    return NextResponse.json(
      { success: true, updated },
      { status: 200, headers: noStore }
    );
  } catch (error) {
    console.error("[PATCH /api/admin/maintenance/[id]]", error);
    return NextResponse.json(
      { error: "Failed to update status" },
      { status: 500, headers: noStore }
    );
  }
}
