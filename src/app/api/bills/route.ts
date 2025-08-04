// 📁 src/app/api/bills/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getUserIdFromCookie } from "@/lib/auth";

export async function GET() {
  const userId = await getUserIdFromCookie();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bills = await db.bill.findMany({
    where: { tenantId: userId },
    orderBy: { billingMonth: "desc" },
  });

  return NextResponse.json({ bills });
}
