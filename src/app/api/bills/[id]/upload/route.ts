import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
import { checkUserAuthOrReject } from '@/lib/auth';
import { uploadImageToStorage } from '@/lib/uploadImageToStorage';

export const POST = async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  const authResult = await checkUserAuthOrReject();
  if (authResult instanceof NextResponse) return authResult;

  const billId = params.id;

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const transactionRef = formData.get('transactionRef')?.toString();

    if (!file || !transactionRef) {
      return NextResponse.json({ error: 'ข้อมูลไม่ครบ' }, { status: 400 });
    }

    // 🟢 ใช้ฟังก์ชันที่คุณสร้างไว้
    const imageUrl = await uploadImageToStorage(file, `bill-${billId}`);

    const updated = await db.bill.update({
      where: { id: billId },
      data: {
        paymentSlipUrl: imageUrl,
        paymentDate: new Date(),
        transactionRef,
      },
    });

    return NextResponse.json({ success: true, bill: updated });
  } catch (err) {
    console.error("❌ Upload error:", err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
};
