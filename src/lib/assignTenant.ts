// src/lib/assignTenant.ts
import { PrismaClient, Prisma, MoveOutStatus } from "@prisma/client";

type Tx = PrismaClient | Prisma.TransactionClient;

export async function assignTenantToRoom(
  tx: Tx,
  profileId: string,
  roomId: string
) {
  // 1) ตรวจผู้เช่า
  const tenant = await tx.profile.findUnique({
    where: { id: profileId },
    select: { id: true, roomId: true },
  });
  if (!tenant) throw new Error("Tenant not found");

  // 2) กันมีคำร้องย้ายออกค้างอยู่ (PENDING/APPROVED)
  const activeMoveout = await tx.moveOutRequest.findFirst({
    where: {
      userId: profileId,
      status: { in: [MoveOutStatus.PENDING_APPROVAL, MoveOutStatus.APPROVED] },
    },
    select: { id: true },
  });
  if (activeMoveout) throw new Error("Tenant has an active move-out request");

  // 3) ตรวจห้องปลายทาง
  const room = await tx.room.findUnique({
    where: { id: roomId },
    select: { id: true, tenant: { select: { id: true } } },
  });
  if (!room) throw new Error("Room not found");
  if (room.tenant) throw new Error("Room already occupied");

  // ถ้าอยู่ห้องเดิมอยู่แล้ว ไม่ต้องทำอะไร
  if (tenant.roomId === roomId) {
    return { changed: false, roomId, previousRoomId: roomId };
  }

  // 4) ปลดห้องเดิม (ถ้ามี)
  const previousRoomId = tenant.roomId ?? null;
  if (previousRoomId) {
    await tx.room.update({
      where: { id: previousRoomId },
      data: {
        tenant: { disconnect: true }, // << แทน tenantId: null
        status: "AVAILABLE",
        assignedAt: null,
      },
    });
  }

  // 5) ผูกผู้เช่ากับห้องใหม่
  await tx.profile.update({
    where: { id: profileId },
    data: {
      roomId,                // FK อยู่ที่ Profile
      roomStartDate: new Date(),
      isActive: true,
    },
  });

  await tx.room.update({
    where: { id: roomId },
    data: {
      tenant: { connect: { id: profileId } }, // << ใช้ nested write
      status: "OCCUPIED",
      assignedAt: new Date(),
    },
  });

  return { changed: true, roomId, previousRoomId };
}
