import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/prisma'
import { checkAdminAuthOrReject } from '@/lib/auth'

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await checkAdminAuthOrReject()
  if (authResult instanceof NextResponse) return authResult

  const billId = params.id

  try {
    const bill = await db.bill.findUnique({
      where: { id: billId },
      select: {
        id: true,
        billingMonth: true,
        rentAmount: true,
        waterUnit: true,
        waterRate: true,
        electricUnit: true,
        electricRate: true,
        totalAmount: true,
        status: true,
        paymentSlipUrl: true,
        paymentDate: true,
        transactionRef: true,
        tenant: { select: { firstName: true, lastName: true } },
        room: { select: { roomNumber: true } },
      },
    });

    if (!bill) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลบิล' }, { status: 404 });
    }

    return NextResponse.json(bill);
  } catch (err) {
    console.error('Error fetching bill:', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await checkAdminAuthOrReject()
  if (authResult instanceof NextResponse) return authResult

  const billId = params.id

  try {
    const { status } = await req.json()

    if (!status || !["PAID", "UNPAID"].includes(status)) {
      return NextResponse.json({ error: 'สถานะไม่ถูกต้อง' }, { status: 400 })
    }

    const updated = await db.bill.update({
      where: { id: billId },
      data: { status },
    })

    return NextResponse.json({ success: true, bill: updated })
  } catch (err) {
    console.error("❌ Error updating bill status:", err)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการอัปเดตสถานะ' }, { status: 500 })
  }
}
