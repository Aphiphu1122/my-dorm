// src/app/api/maintenance/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { checkUserAuthOrReject } from "@/lib/auth";
import { uploadImageToStorage } from "@/lib/uploadImageToStorage";
import { MaintenanceCategory } from "@prisma/client";
import { z } from "zod";

/** ===== Runtime & Caching (เส้นทางผูก cookie → no-store) ===== */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
const noStore = {
  "Cache-Control": "no-store, no-cache, must-revalidate, private",
} as const;

/** ===== ข้อจำกัดไฟล์ ===== */
const MAX_FILES = 6;
const MAX_SIZE = 8 * 1024 * 1024; // 8MB
const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
]);

/** ===== ตรวจฟอร์ม (description & category) ===== */
const formSchema = z.object({
  description: z.string().trim().min(1, "กรุณาระบุรายละเอียด").max(2000),
  // รับอะไรมาก็ได้ แล้วแปลงเป็นตัวพิมพ์ใหญ่ก่อนตรวจ enum
  category: z.string().trim().transform((v) => v.toUpperCase()),
});

export async function POST(req: NextRequest) {
  // ✅ ต้องเป็นผู้ใช้ role=user เท่านั้น
  const auth = await checkUserAuthOrReject();
  if (auth instanceof NextResponse) {
    auth.headers.set("Cache-Control", noStore["Cache-Control"]);
    return auth;
  }
  const { userId } = auth as { userId: string };

  try {
    const fd = await req.formData();

    // parse + validate fields
    const parsed = formSchema.safeParse({
      description: fd.get("description"),
      category: fd.get("category"),
    });
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 422, headers: noStore }
      );
    }
    const { description, category } = parsed.data;

    // ตรวจว่า category อยู่จริงใน enum Prisma
    const enumValues = Object.values(MaintenanceCategory) as string[];
    if (!enumValues.includes(category)) {
      return NextResponse.json(
        { error: "Invalid category" },
        { status: 400, headers: noStore }
      );
    }
    const categoryEnum = category as MaintenanceCategory;

    // ✅ ต้องมีห้องถึงจะส่งคำขอได้
    const prof = await db.profile.findUnique({
      where: { id: userId },
      select: { roomId: true, room: { select: { id: true } } },
    });
    const roomId = prof?.room?.id ?? prof?.roomId ?? null;
    if (!roomId) {
      return NextResponse.json(
        { error: "User has no room assigned" },
        { status: 400, headers: noStore }
      );
    }

    // ✅ รูปภาพ (optional)
    const files = fd.getAll("images").filter((f): f is File => f instanceof File);
    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `อัปโหลดได้สูงสุด ${MAX_FILES} รูป` },
        { status: 400, headers: noStore }
      );
    }
    for (const f of files) {
      if (!ALLOWED_MIME.has(f.type)) {
        return NextResponse.json(
          { error: `ชนิดไฟล์ไม่รองรับ: ${f.type}` },
          { status: 400, headers: noStore }
        );
      }
      if (typeof f.size === "number" && f.size > MAX_SIZE) {
        return NextResponse.json(
          { error: `ไฟล์ใหญ่เกินไป (จำกัด ${Math.floor(MAX_SIZE / (1024 * 1024))}MB)` },
          { status: 400, headers: noStore }
        );
      }
    }

    // ✅ อัปโหลด (เก็บไว้ในโฟลเดอร์ maintenance/<userId>)
    const imageUrls: string[] = [];
    for (const file of files) {
      const url = await uploadImageToStorage(file, `maintenance/${userId}`);
      imageUrls.push(url);
    }

    // ✅ บันทึกคำขอแจ้งซ่อม
    const created = await db.maintenanceRequest.create({
      data: {
        description,
        category: categoryEnum,
        imageUrls: imageUrls,
        userId,
        roomId,
        // หากมีสถานะเริ่มต้น เช่น PENDING ให้ใส่ด้วย
        // status: "PENDING",
      },
      select: { id: true },
    });

    return NextResponse.json(
      { success: true, id: created.id },
      { status: 201, headers: noStore }
    );
  } catch (error) {
    console.error("[POST /api/maintenance] error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500, headers: noStore }
    );
  }
}
