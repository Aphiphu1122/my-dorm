import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { checkUserAuthOrReject } from "@/lib/auth";
import { uploadImageToStorage } from "@/lib/uploadImageToStorage";

/** Runtime & Caching (route ผูก cookie → กันแคชทั้งหมด) */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
const noStore = { "Cache-Control": "no-store, no-cache, must-revalidate, private" } as const;

/** จำกัดไฟล์ */
const MAX_SIZE = 8 * 1024 * 1024; // 8MB
const ALLOWED_MIME = new Set([
  "image/png","image/jpeg","image/jpg","image/webp","image/heic","image/heif","image/gif",
]);

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await checkUserAuthOrReject();

  if (auth instanceof NextResponse) {
    auth.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
    return auth;
  }

  const { userId } = auth;

  const billId = params?.id;
  if (!billId) {
    return NextResponse.json({ error: "Missing bill id" }, { status: 400, headers: noStore });
  }

  try {
    const billOwner = await db.bill.findUnique({
      where: { id: billId },
      select: { tenantId: true },
    });
    if (!billOwner) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404, headers: noStore });
    }
    if (billOwner.tenantId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: noStore });
    }

    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "กรุณาอัปโหลดไฟล์" }, { status: 400, headers: noStore });
    }
    if (!ALLOWED_MIME.has(file.type)) {
      return NextResponse.json({ error: "ชนิดไฟล์ไม่รองรับ (ต้องเป็นรูปภาพ)" }, { status: 400, headers: noStore });
    }
    if (typeof file.size === "number" && file.size > MAX_SIZE) {
      return NextResponse.json({ error: "ไฟล์ใหญ่เกินไป (จำกัด 8MB)" }, { status: 400, headers: noStore });
    }

    // ✅ อัปโหลด
    const imageUrl = await uploadImageToStorage(file, `bills/${billId}`);

    const updated = await db.bill.update({
      where: { id: billId },
      data: {
        paymentSlipUrl: imageUrl,
        paymentDate: new Date(),
        status: "PENDING_APPROVAL",
      },
      select: { id: true, status: true, paymentSlipUrl: true, paymentDate: true },
    });

    return NextResponse.json({ success: true, bill: updated }, { status: 200, headers: noStore });
  } catch (err) {
    console.error("❌ Upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500, headers: noStore });
  }
}
