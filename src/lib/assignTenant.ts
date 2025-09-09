// src/lib/assignTenant.ts
import { PrismaClient, Prisma } from "@prisma/client";

export async function assignTenantToRoom(
  tx: PrismaClient | Prisma.TransactionClient,
  profileId: string,
  roomId: string
) {
  // ตรวจสอบว่าห้องมีอยู่และยังว่าง
  const room = await tx.room.findUnique({ where: { id: roomId } });
  if (!room) throw new Error("Room not found");
  if (room.tenantId) throw new Error("Room already occupied");

  // อัปเดต profile ให้ผูกกับ room
  await tx.profile.update({
    where: { id: profileId },
    data: {
      roomId: roomId,
      roomStartDate: new Date(),
      isActive: true,
    },
  });

  // อัปเดต room ให้มี tenant
  await tx.room.update({
    where: { id: roomId },
    data: {
      tenantId: profileId,
      status: "OCCUPIED",
      assignedAt: new Date(),
    },
  });
}
