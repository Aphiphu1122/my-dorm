// 📁 /app/api/admin/active-tenants/route.ts

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
    select: {
      id: true,
      roomNumber: true,
      tenantId: true,
      tenant: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  return NextResponse.json(rooms);
}
