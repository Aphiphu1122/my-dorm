import { db } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getRoleFromCookie } from "@/lib/auth";

export async function GET() {
  const role = await getRoleFromCookie();
  if (role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const rooms = await db.room.findMany({
    where: {
      tenantId: { not: null },
      status: "OCCUPIED",
    },
    include: {
      tenant: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      bills: {
        orderBy: { billingMonth: "desc" },
        take: 1, // ✅ ดึงบิลล่าสุด
        select: {
          waterCurr: true,
          electricCurr: true,
        },
      },
    },
  });

  // ✅ reshape response
  const result = rooms.map((room) => ({
    id: room.id,
    roomNumber: room.roomNumber,
    tenantId: room.tenantId!,
    tenant: room.tenant,
    lastWater: room.bills[0]?.waterCurr || 0,
    lastElectric: room.bills[0]?.electricCurr || 0,
  }));

  return NextResponse.json(result);
}
