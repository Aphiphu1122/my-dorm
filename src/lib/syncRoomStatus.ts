import { db } from "@/lib/prisma";

export async function syncRoomStatus(roomId: string) {
  const room = await db.room.findUnique({
    where: { id: roomId },
    include: { tenant: true },
  });

  if (!room) return;

  const newStatus = room.tenant ? "OCCUPIED" : "AVAILABLE";

  if (room.status !== newStatus) {
    await db.room.update({
      where: { id: roomId },
      data: { status: newStatus },
    });
  }
}
