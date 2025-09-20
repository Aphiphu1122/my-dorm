// 📁 src/app/api/bills/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getUserIdFromCookie } from "@/lib/auth";
import { z } from "zod";
import { BillStatus } from "@prisma/client";

/** ปิดแคชทั้งหมด เพราะผูกกับคุกกี้ */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
const noStore = {
  "Cache-Control": "no-store, no-cache, must-revalidate, private",
} as const;

const patchSchema = z.object({
  paymentSlipUrl: z.string().url().optional(),
  paymentDate: z.string().datetime().optional(), // ISO string
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const billId = params.id;

    const userId = await getUserIdFromCookie();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: noStore });
    }

    const bill = await db.bill.findUnique({
      where: { id: billId },
      select: {
        id: true,
        tenantId: true,
        billingMonth: true,
        totalAmount: true,
        status: true,
        paymentSlipUrl: true,
        paymentDate: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!bill || bill.tenantId !== userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404, headers: noStore });
    }

    return NextResponse.json({ bill }, { status: 200, headers: noStore });
  } catch (e) {
    console.error("GET bill error:", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500, headers: noStore });
  }
}

/** แนบสลิป / แก้ข้อมูลการชำระ */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const billId = params.id;

    const userId = await getUserIdFromCookie();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: noStore });
    }

    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400, headers: noStore });
    }

    const current = await db.bill.findUnique({
      where: { id: billId },
      select: {
        id: true,
        tenantId: true,
        status: true,
        paymentSlipUrl: true,
        paymentDate: true,
      },
    });

    if (!current || current.tenantId !== userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404, headers: noStore });
    }

    // ถ้าชำระเสร็จสมบูรณ์แล้ว ไม่ให้แก้
    if (current.status === BillStatus.PAID) {
      return NextResponse.json(
        { error: "บิลนี้ชำระเสร็จแล้ว ไม่สามารถแก้ไขได้" },
        { status: 409, headers: noStore }
      );
    }

    const { paymentSlipUrl, paymentDate } = parsed.data;

    const updated = await db.bill.update({
      where: { id: billId },
      data: {
        paymentSlipUrl: paymentSlipUrl ?? current.paymentSlipUrl,
        paymentDate: paymentDate ? new Date(paymentDate) : current.paymentDate ?? new Date(),
        status: BillStatus.PENDING_APPROVAL,
      },
      select: {
        id: true,
        status: true,
        paymentSlipUrl: true,
        paymentDate: true,
        billingMonth: true,
        totalAmount: true,
      },
    });

    return NextResponse.json({ bill: updated }, { status: 200, headers: noStore });
  } catch (e) {
    console.error("PATCH bill error:", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500, headers: noStore });
  }
}
