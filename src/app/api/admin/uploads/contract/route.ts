// src/app/api/admin/tenants/uploads/contract/route.ts
import { NextResponse } from "next/server";
import { getRoleFromCookie } from "@/lib/auth";
import { uploadManyImagesToStorage } from "@/lib/uploadImageToStorage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const noStore = {
  "Cache-Control": "no-store, no-cache, must-revalidate, private",
} as const;

const MAX_FILES = 10;
const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
]);

export async function POST(req: Request) {
  try {
    const role = await getRoleFromCookie();
    if (role !== "admin") {
      return new NextResponse("Unauthorized", { status: 401, headers: noStore });
    }

    const form = await req.formData();

    const rawEntries = [
      ...form.getAll("files"),
      ...form.getAll("file"),
      ...Array.from(form.values()),
    ];
    const files: File[] = Array.from(
      new Set(rawEntries.filter((v): v is File => v instanceof File))
    );

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: "ไม่พบไฟล์อัปโหลด" },
        { status: 400, headers: noStore }
      );
    }
    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { success: false, error: `อัปโหลดได้สูงสุด ${MAX_FILES} ไฟล์ต่อครั้ง` },
        { status: 400, headers: noStore }
      );
    }

    for (const f of files) {
      if (!f.type || !ALLOWED_MIME.has(f.type)) {
        return NextResponse.json(
          {
            success: false,
            error: `ไฟล์ ${f.name} ไม่ใช่รูปภาพประเภทที่อนุญาต`,
          },
          { status: 415, headers: noStore }
        );
      }
      if (typeof f.size === "number" && f.size > MAX_SIZE) {
        return NextResponse.json(
          {
            success: false,
            error: `ไฟล์ ${f.name} มีขนาดเกิน ${Math.floor(MAX_SIZE / (1024 * 1024))}MB`,
          },
          { status: 400, headers: noStore }
        );
      }
    }

    // ✅ แก้ตรงนี้: ส่งเป็น options object ให้ตรง type ใหม่
    const urls = await uploadManyImagesToStorage(files, {
      prefix: "contract",
      folder: "contracts",
    });

    return NextResponse.json({ success: true, urls }, { status: 200, headers: noStore });
  } catch (err) {
    console.error("Upload contract images error:", err);
    return NextResponse.json(
      { success: false, error: "อัปโหลดล้มเหลว" },
      { status: 500, headers: noStore }
    );
  }
}
