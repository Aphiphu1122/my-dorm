// src/app/api/admin/bills/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { checkAdminAuthOrReject } from "@/lib/auth";
import { BillStatus } from "@prisma/client";
import { z } from "zod";

/** เส้นทางใช้คุกกี้ → กันแคชให้หมด */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
const noStore = {
  "Cache-Control": "no-store, no-cache, must-revalidate, private",
} as const;

/** ---------- GET: ดึงบิลแบบละเอียด (แอดมิน) ---------- */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // <-- params เป็น Promise
) {
  const auth = await checkAdminAuthOrReject();
  if (auth instanceof NextResponse) {
    auth.headers.set("Cache-Control", noStore["Cache-Control"]);
    return auth;
  }

  const { id: billId } = await params;

  try {
    const bill = await db.bill.findUnique({
      where: { id: billId },
      select: {
        id: true,
        billingMonth: true,
        rentAmount: true,

        waterPrev: true,
        waterCurr: true,
        waterUnit: true,
        waterRate: true,

        electricPrev: true,
        electricCurr: true,
        electricUnit: true,
        electricRate: true,

        totalAmount: true,
        status: true,
        paymentSlipUrl: true,
        paymentDate: true,
        tenant: { select: { firstName: true, lastName: true } },
        room: { select: { roomNumber: true } },
      },
    });

    if (!bill) {
      return NextResponse.json(
        { error: "ไม่พบข้อมูลบิล" },
        { status: 404, headers: noStore }
      );
    }

    return NextResponse.json({ bill }, { status: 200, headers: noStore });
  } catch (err) {
    console.error("❌ Error fetching bill:", err);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาด" },
      { status: 500, headers: noStore }
    );
  }
}

/** ---------- PATCH: อัปเดตสถานะบิล ---------- */
/** ใช้ nativeEnum ให้ type-safe และป้องกันค่าอื่น */
const PatchSchema = z.object({
  status: z.nativeEnum(BillStatus),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // <-- params เป็น Promise
) {
  const auth = await checkAdminAuthOrReject();
  if (auth instanceof NextResponse) {
    auth.headers.set("Cache-Control", noStore["Cache-Control"]);
    return auth;
  }

  const { id: billId } = await params;

  try {
    const json = await req.json();
    const parsed = PatchSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "สถานะไม่ถูกต้อง" },
        { status: 400, headers: noStore }
      );
    }

    const nextStatus = parsed.data.status;

    // ดึงสถานะปัจจุบัน + สลิป/วันที่ชำระ เพื่ออัปเดตแบบมีเงื่อนไข
    const current = await db.bill.findUnique({
      where: { id: billId },
      select: { id: true, paymentDate: true, paymentSlipUrl: true },
    });
    if (!current) {
      return NextResponse.json(
        { error: "ไม่พบบิล" },
        { status: 404, headers: noStore }
      );
    }

    const data: {
      status: BillStatus;
      paymentDate?: Date | null;
      paymentSlipUrl?: string | null;
    } = { status: nextStatus };

    // นโยบายอัปเดต:
    // - เมื่อ UNPAID: ล้างสลิปและวันชำระ (ย้อนสถานะ)
    // - เมื่อ PENDING_APPROVAL: คงสลิปไว้ (ถ้ามี)
    // - เมื่อ PAID: ถ้ายังไม่มี paymentDate ให้ประทับเวลาปัจจุบัน
    if (nextStatus === "UNPAID") {
      data.paymentDate = null;
      data.paymentSlipUrl = null;
    } else if (nextStatus === "PAID" && !current.paymentDate) {
      data.paymentDate = new Date();
    }

    const updated = await db.bill.update({
      where: { id: billId },
      data,
      select: {
        id: true,
        status: true,
        paymentSlipUrl: true,
        paymentDate: true,
      },
    });

    return NextResponse.json(
      { success: true, bill: updated },
      { status: 200, headers: noStore }
    );
  } catch (err) {
    console.error("❌ Error updating bill status:", err);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการอัปเดตสถานะ" },
      { status: 500, headers: noStore }
    );
  }
}

/** ---------- DELETE: ลบบิล ---------- */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // <-- params เป็น Promise
) {
  const auth = await checkAdminAuthOrReject();
  if (auth instanceof NextResponse) {
    auth.headers.set("Cache-Control", noStore["Cache-Control"]);
    return auth;
  }
  
  const { id: billId } = await params;

  try {
    const deleted = await db.bill.delete({
      where: { id: billId },
    });

    return NextResponse.json(
      { success: true, deleted },
      { status: 200, headers: noStore }
    );
  } catch (err) {
    console.error("❌ Error deleting bill:", err);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการลบบิล" },
      { status: 500, headers: noStore }
    );
  }
}
