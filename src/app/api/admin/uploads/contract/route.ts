import { NextResponse } from "next/server";
import { getRoleFromCookie } from "@/lib/auth";
import { uploadManyImagesToStorage } from "@/lib/uploadImageToStorage";

// ให้แน่ใจว่าใช้ Node runtime (ต้องใช้ Cloudinary SDK)
export const runtime = "nodejs";

// POST multipart/form-data  => field name: files (multiple)
export async function POST(req: Request) {
  try {
    const role = await getRoleFromCookie();
    if (role !== "admin") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const form = await req.formData();
    const files = form.getAll("files") as File[];
    if (!files || files.length === 0) {
      return NextResponse.json({ success: false, error: "ไม่พบไฟล์อัปโหลด" }, { status: 400 });
    }
    if (files.length > 3) {
      return NextResponse.json({ success: false, error: "อัปโหลดได้สูงสุด 3 ไฟล์" }, { status: 400 });
    }

    const urls = await uploadManyImagesToStorage(files, "contract");
    return NextResponse.json({ success: true, urls }, { status: 200 });
  } catch (err) {
    console.error("Upload contract images error:", err);
    return NextResponse.json(
      { success: false, error: "อัปโหลดล้มเหลว" },
      { status: 500 }
    );
  }
}
