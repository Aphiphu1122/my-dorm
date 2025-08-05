// 📁 src/app/api/bills/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getUserIdFromCookie } from "@/lib/auth";

export async function GET() {
  try {
    const userId = await getUserIdFromCookie();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    return NextResponse.json({ bills });
  } catch (err) {
    console.error("💥 Failed to fetch bills:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
