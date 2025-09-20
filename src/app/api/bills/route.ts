// 📁 src/app/api/bills/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getUserIdFromCookie } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const noStore = {
  "Cache-Control": "no-store, no-cache, must-revalidate, private",
} as const;

export async function GET() {
  try {
    const userId = await getUserIdFromCookie();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: noStore });
    }

    const bills = await db.bill.findMany({
      where: { tenantId: userId },
      orderBy: { billingMonth: "desc" },
      select: {
        id: true,
        billingMonth: true, 
        totalAmount: true,
        status: true,
        paymentSlipUrl: true,
      },
    });

    return NextResponse.json({ bills }, { headers: noStore });
  } catch (err) {
    console.error("💥 Failed to fetch bills:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500, headers: noStore });
  }
}
