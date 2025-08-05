import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getUserIdFromCookie } from "@/lib/auth";
import { z } from "zod";
import { BillStatus } from "@prisma/client";

// ✅ PATCH: schema สำหรับแนบสลิป
const patchSchema = z.object({
  paymentSlipUrl: z.string().url().optional(),
  paymentDate: z.string().datetime().optional(),
  transactionRef: z.string().optional(),
});

// ✅ GET: ดึงบิลของผู้ใช้ตาม ID
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> } // ⬅️ ต้องใช้ Promise และ await
) {
  try {
    const { id: billId } = await context.params;

    const userId = await getUserIdFromCookie();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bill = await db.bill.findUnique({
      where: { id: billId },
    });

    // ตรวจสอบว่าผู้ใช้เป็นเจ้าของบิลนี้
    if (!bill || bill.tenantId !== userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ bill }, { status: 200 });
  } catch (e) {
    console.error("GET bill error:", e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// ✅ PATCH: แนบสลิป / เพิ่มข้อมูลการชำระ
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> } // ⬅️ เช่นกัน ต้อง await
) {
  try {
    const { id: billId } = await context.params;

    const userId = await getUserIdFromCookie();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = patchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const current = await db.bill.findUnique({
      where: { id: billId },
    });

    if (!current || current.tenantId !== userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { paymentSlipUrl, paymentDate, transactionRef } = parsed.data;
    console.log("🔎 PATCH received:", { paymentSlipUrl, paymentDate, transactionRef });


    const updated = await db.bill.update({
      where: { id: billId },
      data: {
        paymentSlipUrl: paymentSlipUrl ?? current.paymentSlipUrl,
        paymentDate: paymentDate ? new Date(paymentDate) : current.paymentDate,
        transactionRef: transactionRef ?? current.transactionRef,
        status: BillStatus.PENDING_APPROVAL, // ✅ อัปเดตสถานะใหม่
      },
    });

    return NextResponse.json({ bill: updated }, { status: 200 });
  } catch (e) {
    console.error("PATCH bill error:", e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
