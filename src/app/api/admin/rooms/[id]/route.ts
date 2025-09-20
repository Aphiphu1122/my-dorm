// src/app/api/admin/rooms/[id]/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/prisma";
import { checkAdminAuthOrReject, getRoleFromCookie } from "@/lib/auth";
import { z } from "zod";
import { RoomStatus } from "@prisma/client";

/** route นี้ผูก cookie → ปิด cache ทั้งหมด */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
const noStoreHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, private",
} as const;

const ok = (data: unknown, status = 200) =>
  NextResponse.json({ success: true, ...(data as object) }, { status, headers: noStoreHeaders });
const err = (message: string, status: number) =>
  NextResponse.json({ success: false, error: message }, { status, headers: noStoreHeaders });

const ALLOWED_STATUS: RoomStatus[] = ["AVAILABLE", "OCCUPIED", "MAINTENANCE"];

/* ----------------------------- Schemas ----------------------------- */
const ParamsSchema = z.object({ id: z.string().min(1) });
const PatchSchema = z
  .object({
    roomNumber: z.string().trim().min(1).optional(),
    status: z.enum(["AVAILABLE", "OCCUPIED", "MAINTENANCE"]).optional(),
    tenantId: z.string().uuid().optional(),
  })
  .refine((o) => Object.keys(o).length > 0, { message: "ไม่มีข้อมูลสำหรับปรับปรุง" });

/* =============================== GET =============================== */
/**
 * ส่งข้อมูลให้หน้า UI:
 * - room basic + assignedAt
 * - tenant ปัจจุบัน (อิงจาก profile.roomId)
 * - latestContract ของห้องนี้
 * - contracts ทั้งหมดของห้องนี้ (ล่าสุดก่อน)
 * - maintenanceCount
 */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const role = await getRoleFromCookie();
  if (role !== "admin") return err("Unauthorized", 403);

  const { id } = ParamsSchema.parse(params);

  const room = await db.room.findUnique({
    where: { id },
    include: { maintenanceRequests: true },
  });
  if (!room) return err("ไม่พบห้อง", 404);

  const tenant = await db.profile.findFirst({
    where: { roomId: room.id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      roomStartDate: true,
    },
  });

  const contracts = await db.contract.findMany({
    where: { roomId: room.id },
    orderBy: { startDate: "desc" },
    select: {
      id: true,
      startDate: true,
      endDate: true,
      rentPerMonth: true,
      contractDate: true,
      contractImages: true,
    },
  });

  const latestContract = contracts[0] ?? null;

  return ok({
    room: {
      id: room.id,
      roomNumber: room.roomNumber,
      status: room.status,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
      assignedAt: room.assignedAt,
      maintenanceCount: room.maintenanceRequests.length,
      tenant,
      latestContract,
      contracts,
    },
  });
}

/* ============================== PATCH ============================== */
/**
 * รองรับ:
 * - เปลี่ยนหมายเลขห้อง / สถานะห้อง
 * - Assign tenant เข้าห้องนี้แบบ atomic
 *   - ถ้า tenant เดิมมีห้อง → ปลดห้องเดิม AVAILABLE
 *   - ตั้งห้องปัจจุบันเป็น OCCUPIED + assignedAt = now
 *   - อัปเดต profile.roomId + roomStartDate
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await checkAdminAuthOrReject();
  if (auth instanceof NextResponse) {
    auth.headers.set("Cache-Control", noStoreHeaders["Cache-Control"]);
    return auth;
  }

  try {
    const { id: roomId } = ParamsSchema.parse(params);
    const body = PatchSchema.parse(await req.json());

    const room = await db.room.findUnique({ where: { id: roomId } });
    if (!room) return err("ไม่พบห้อง", 404);

    const { roomNumber, status, tenantId } = body;

    // validate status ถ้าส่งมา
    if (status && !ALLOWED_STATUS.includes(status)) {
      return err("สถานะห้องไม่ถูกต้อง", 400);
    }

    // กันเลขห้องซ้ำ (กรณีเปลี่ยนเลข)
    if (roomNumber && roomNumber.trim() !== room.roomNumber) {
      const dup = await db.room.findFirst({
        where: { roomNumber: { equals: roomNumber.trim(), mode: "insensitive" } },
        select: { id: true },
      });
      if (dup) return err("มีเลขห้องนี้อยู่แล้ว", 409);
    }

    // ถ้ามีการ assign tenant ใหม่
    if (tenantId) {
      const tenant = await db.profile.findUnique({
        where: { id: tenantId },
        select: { id: true, roomId: true },
      });
      if (!tenant) return err("ไม่พบผู้ใช้ที่ต้องการผูกห้อง", 404);

      // ห้องนี้มีผู้เช่าคนอื่นอยู่แล้ว → ห้าม
      const currentHolder = await db.profile.findFirst({
        where: { roomId: roomId },
        select: { id: true },
      });
      if (currentHolder && currentHolder.id !== tenantId) {
        return err("ห้องนี้มีผู้เช่าอยู่แล้ว", 400);
      }

      await db.$transaction(async (tx) => {
        // ปลดห้องเดิมของ tenant (ถ้ามี และไม่ใช่ห้องนี้)
        if (tenant.roomId && tenant.roomId !== roomId) {
          await tx.room.update({
            where: { id: tenant.roomId },
            data: { status: "AVAILABLE", assignedAt: null },
          });
        }

        // ผูก tenant -> ห้องนี้
        await tx.profile.update({
          where: { id: tenantId },
          data: { roomId, roomStartDate: new Date() },
        });

        // ตั้งห้องนี้ให้ OCCUPIED
        await tx.room.update({
          where: { id: roomId },
          data: { status: "OCCUPIED", assignedAt: new Date() },
        });

        // ถ้าพร้อมกันอยากแก้เลขห้องด้วย
        if (roomNumber && roomNumber.trim() !== room.roomNumber) {
          await tx.room.update({
            where: { id: roomId },
            data: { roomNumber: roomNumber.trim() },
          });
        }
      });

      return ok({ message: "กำหนดผู้เช่าให้ห้องนี้เรียบร้อย" });
    }

    // กรณีอัปเดตเลข/สถานะอย่างเดียว
    type RoomUpdateData = Parameters<typeof db.room.update>[0]["data"];
    const dataToUpdate: RoomUpdateData = {};
    if (roomNumber) dataToUpdate.roomNumber = roomNumber.trim();
    if (status) dataToUpdate.status = status;

    // ถ้าจะตั้ง AVAILABLE แต่ยังมีผู้เช่าเกาะอยู่ → บล็อก
    if (status === "AVAILABLE") {
      const holder = await db.profile.findFirst({ where: { roomId } });
      if (holder) {
        return err("ไม่สามารถตั้งเป็น AVAILABLE ได้: ยังมีผู้เช่าอยู่ในห้องนี้", 400);
      }
      dataToUpdate.assignedAt = null;
    }

    const updatedRoom = await db.room.update({
      where: { id: roomId },
      data: dataToUpdate,
    });

    return ok({ room: updatedRoom });
  } catch (e) {
    console.error("❌ PATCH ROOM ERROR:", e);
    return err("เกิดข้อผิดพลาดในการอัปเดตห้อง", 500);
  }
}

/* ============================== DELETE ============================== */
/**
 * ลบห้องได้เมื่อ:
 * - ไม่มีผู้เช่าเกาะอยู่
 * - ไม่มีบิล/คำร้องซ่อมค้างในระบบ
 */
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await checkAdminAuthOrReject();
  if (auth instanceof NextResponse) {
    auth.headers.set("Cache-Control", noStoreHeaders["Cache-Control"]);
    return auth;
  }

  try {
    const { id: roomId } = ParamsSchema.parse(params);

    const room = await db.room.findUnique({
      where: { id: roomId },
      include: { maintenanceRequests: true, bills: true },
    });
    if (!room) return err("ไม่พบห้องที่ต้องการลบ", 404);

    const holder = await db.profile.findFirst({ where: { roomId } });
    if (holder) return err("ไม่สามารถลบห้องได้ เนื่องจากยังมีผู้เช่าอยู่", 400);

    if (room.bills.length > 0 || room.maintenanceRequests.length > 0) {
      return err("ไม่สามารถลบห้องนี้ได้ เนื่องจากมีบิลหรือคำร้องแจ้งซ่อมอยู่ในระบบ", 400);
    }

    await db.room.delete({ where: { id: roomId } });
    return ok({ message: "ลบห้องสำเร็จ" });
  } catch (e) {
    console.error("❌ DELETE ROOM ERROR:", e);
    return err("เกิดข้อผิดพลาดในการลบห้อง", 500);
  }
}
