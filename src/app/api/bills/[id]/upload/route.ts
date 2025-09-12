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
    // ❌ เอา transactionRef ออก
    // const transactionRef = formData.get('transactionRef')?.toString();

    if (!file) {
      return NextResponse.json({ error: 'กรุณาอัปโหลดไฟล์' }, { status: 400 });
    }

    const imageUrl = await uploadImageToStorage(file, `bill-${billId}`);

    const updated = await db.bill.update({
      where: { id: billId },
      data: {
        paymentSlipUrl: imageUrl,
        paymentDate: new Date(),
        status: "PENDING_APPROVAL",
      },
    });

    return NextResponse.json({ success: true, bill: updated });
  } catch (err) {
    console.error("❌ Upload error:", err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
};
