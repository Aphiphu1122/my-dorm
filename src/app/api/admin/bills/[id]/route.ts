import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
import { checkAdminAuthOrReject } from '@/lib/auth';
import { BillStatus } from '@prisma/client';

export const dynamic = "force-dynamic";

// ✅ GET: ดึงข้อมูลบิลแบบละเอียด (สำหรับแอดมิน)
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await checkAdminAuthOrReject();
  if (authResult instanceof NextResponse) return authResult;

  const billId = params.id;

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
      return NextResponse.json({ error: "ไม่พบข้อมูลบิล" }, { status: 404 });
    }

    return NextResponse.json({ bill }, { status: 200 });
  } catch (err) {
    console.error("❌ Error fetching bill:", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// ✅ PATCH: อัปเดตสถานะบิล (อนุมัติ / ปฏิเสธ / ตั้งค่าใหม่)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await checkAdminAuthOrReject();
  if (authResult instanceof NextResponse) return authResult;

  const billId = params.id;

  try {
    const { status } = await req.json();

    if (!status || !Object.values(BillStatus).includes(status)) {
      return NextResponse.json({ error: 'สถานะไม่ถูกต้อง' }, { status: 400 });
    }

    const updated = await db.bill.update({
      where: { id: billId },
      data: { status: status as BillStatus },
    });

    return NextResponse.json({ success: true, bill: updated }, { status: 200 });
  } catch (err) {
    console.error("❌ Error updating bill status:", err);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการอัปเดตสถานะ' },
      { status: 500 }
    );
  }
}

// ✅ DELETE
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await checkAdminAuthOrReject();
  if (authResult instanceof NextResponse) return authResult;

  const billId = params.id;

  try {
    const deleted = await db.bill.delete({
      where: { id: billId },
    });

    return NextResponse.json({ success: true, deleted }, { status: 200 });
  } catch (err) {
    console.error("❌ Error deleting bill:", err);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลบบิล' },
      { status: 500 }
    );
  }
}
