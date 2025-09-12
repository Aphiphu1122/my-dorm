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
      status: "OCCUPIED",
      tenant: { isNot: null },
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
        take: 1,
        select: {
          waterCurr: true,
          electricCurr: true,
        },
      },
    },
  });

  const result = rooms.map((room) => {
    const lastBill = room.bills?.[0];
    return {
      id: room.id,
      roomNumber: room.roomNumber,
      tenantId: room.tenant?.id ?? null,
      tenant: room.tenant,
      lastWater: lastBill?.waterCurr ?? 0,
      lastElectric: lastBill?.electricCurr ?? 0,
    };
  });

  return NextResponse.json(result);
}
