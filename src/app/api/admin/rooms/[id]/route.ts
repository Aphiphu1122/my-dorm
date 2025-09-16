import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { Prisma, RoomStatus } from "@prisma/client";
import { getRoleFromCookie } from "@/lib/auth";

/* ---------- helpers ---------- */
const ok = (data: unknown, init: number = 200) =>
  NextResponse.json({ success: true, ...((data as object) ?? {}) }, { status: init });
const err = (message: string, init: number) =>
  NextResponse.json({ success: false, error: message }, { status: init });

const ALLOWED_STATUS: RoomStatus[] = ["AVAILABLE", "OCCUPIED", "MAINTENANCE"];

/* --------------------------------
 * GET /api/admin/rooms/[id]
 * ส่งข้อมูลตามที่หน้า UI ต้องใช้:
 * - room basic + assignedAt
 * - tenant ปัจจุบัน (จาก profile.roomId)
 * - latestContract (ของห้องนี้ เรียงล่าสุด)
 * - contracts (ทั้งหมดของห้องนี้ เรียงล่าสุดก่อน)
 * - maintenanceCount
 * -------------------------------- */
export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const role = await getRoleFromCookie();
  if (role !== "admin") return err("Unauthorized", 403);

  const room = await db.room.findUnique({
    where: { id: params.id },
    include: { maintenanceRequests: true },
  });
  if (!room) return err("ไม่พบห้อง", 404);

  // ผู้เช่าปัจจุบันของห้อง (ถ้ามี)
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

  // สัญญาของ "ห้องนี้" ทั้งหมด (จะครอบคลุมหลายช่วงต่อสัญญา)
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
      tenant,          // ข้อมูลผู้เช่าปัจจุบัน (ถ้ามี)
      latestContract,  // สัญญาล่าสุดของห้อง
      contracts,       // สัญญาทั้งหมดของห้อง
    },
  });
}

/* --------------------------------
 * PATCH /api/admin/rooms/[id]
 * รองรับ:
 * - เปลี่ยนหมายเลขห้อง / สถานะห้อง
 * - assign tenant เข้าห้องนี้ (กันชนกับผู้เช่าคนอื่น)
 *   - ถ้า tenant เดิมมีห้องอยู่ → ปล่อยห้องเดิม AVAILABLE
 *   - ตั้ง room.status = OCCUPIED และ assignedAt = now
 *   - อัปเดต profile.roomId และ roomStartDate (วันที่เข้าพักใหม่)
 * -------------------------------- */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const role = await getRoleFromCookie();
  if (role !== "admin") return err("Unauthorized", 403);

  try {
    const body = await req.json().catch(() => ({}));
    const roomId = params.id as string;

    const room = await db.room.findUnique({ where: { id: roomId } });
    if (!room) return err("ไม่พบห้อง", 404);

    const { roomNumber, status, tenantId } = body as {
      roomNumber?: string;
      status?: RoomStatus;
      tenantId?: string;
    };

    // validate status (ถ้าส่งมา)
    if (status && !ALLOWED_STATUS.includes(status)) {
      return err("สถานะห้องไม่ถูกต้อง", 400);
    }

    // เตรียมข้อมูลที่อัปเดต
    const dataToUpdate: Partial<Prisma.roomUncheckedUpdateInput> = {};
    if (roomNumber) dataToUpdate.roomNumber = roomNumber;
    if (status) dataToUpdate.status = status;

    // ถ้ามีการ assign tenant ใหม่
    if (tenantId) {
      const tenant = await db.profile.findUnique({
        where: { id: tenantId },
        select: { id: true, roomId: true },
      });
      if (!tenant) return err("ไม่พบผู้ใช้ที่ต้องการผูกห้อง", 404);

      // มีผู้ถือห้องนี้อยู่แล้วและไม่ใช่ tenantId ที่จะใส่ → ห้าม
      const currentHolder = await db.profile.findFirst({
        where: { roomId: roomId },
        select: { id: true, firstName: true, lastName: true },
      });
      if (currentHolder && currentHolder.id !== tenantId) {
        return err("ห้องนี้มีผู้เช่าอยู่แล้ว", 400);
      }

      // ทำธุรกรรม: ปลดห้องเดิมของ tenant (ถ้ามี) และผูกกับห้องใหม่
      await db.$transaction(async (tx) => {
        // ถ้ามีห้องเดิมและไม่ใช่ห้องนี้ → ปลดห้องเดิม AVAILABLE
        if (tenant.roomId && tenant.roomId !== roomId) {
          await tx.room.update({
            where: { id: tenant.roomId },
            data: { status: "AVAILABLE", assignedAt: null },
          });
        }

        // set tenant -> ห้องนี้
        await tx.profile.update({
          where: { id: tenantId },
          data: { roomId: roomId, roomStartDate: new Date() },
        });

        // ปรับสถานะห้องปัจจุบัน -> OCCUPIED
        await tx.room.update({
          where: { id: roomId },
          data: { status: "OCCUPIED", assignedAt: new Date() },
        });
      });

      // ไม่ต้องอัปเดตซ้ำอีกด้านล่าง
      return ok({ message: "กำหนดผู้เช่าให้ห้องนี้เรียบร้อย" });
    }

    // กรณีอัปเดตสถานะด้วยตัวเอง:
    // ถ้าจะเปลี่ยนเป็น AVAILABLE แต่ยังมีผู้เช่าเกาะอยู่ → บล็อก
    if (status === "AVAILABLE") {
      const holder = await db.profile.findFirst({ where: { roomId } });
      if (holder) {
        return err("ไม่สามารถตั้งเป็น AVAILABLE ได้: ยังมีผู้เช่าอยู่ในห้องนี้", 400);
      }
      // AVAILABLE → ล้าง assignedAt เพื่อความชัดเจน
      dataToUpdate.assignedAt = null;
    }

    const updatedRoom = await db.room.update({
      where: { id: roomId },
      data: dataToUpdate,
    });

    return ok({ room: updatedRoom });
  } catch (error) {
    console.error("❌ PATCH ROOM ERROR:", error);
    return err("เกิดข้อผิดพลาดในการอัปเดตห้อง", 500);
  }
}

/* --------------------------------
 * DELETE /api/admin/rooms/[id]
 * ลบห้องได้เมื่อ:
 * - ไม่มีผู้เช่าเกาะอยู่
 * - ไม่มีบิล/คำร้องซ่อมในระบบ (เพื่อความปลอดภัย)
 * -------------------------------- */
export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const role = await getRoleFromCookie();
  if (role !== "admin") return err("Unauthorized", 403);

  try {
    const roomId = params.id;

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
  } catch (error) {
    console.error("❌ DELETE ROOM ERROR:", error);
    return err("เกิดข้อผิดพลาดในการลบห้อง", 500);
  }
}
