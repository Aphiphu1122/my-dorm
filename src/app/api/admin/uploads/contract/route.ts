// /api/admin/tenants/uploads/contract/route.ts
import { NextResponse } from "next/server";
import { getRoleFromCookie } from "@/lib/auth";
import { uploadManyImagesToStorage } from "@/lib/uploadImageToStorage";

// ใช้ Cloudinary/SDK ต่าง ๆ -> ต้องเป็น Node runtime
export const runtime = "nodejs";
// ป้องกันการ cache เส้นทางอัปโหลด
export const dynamic = "force-dynamic";

const MAX_FILES = 10;                
const MAX_SIZE = 10 * 1024 * 1024;   

export async function POST(req: Request) {
  try {
    const role = await getRoleFromCookie();
    if (role !== "admin") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const form = await req.formData();

    // formData อาจมีค่าอื่นปะปนมา -> filter เฉพาะที่เป็น File จริง ๆ
    const files = form.getAll("files").filter((f): f is File => f instanceof File);

    if (files.length === 0) {
      return NextResponse.json({ success: false, error: "ไม่พบไฟล์อัปโหลด" }, { status: 400 });
    }
    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { success: false, error: `อัปโหลดได้สูงสุด ${MAX_FILES} ไฟล์` },
        { status: 400 }
      );
    }

    // ตรวจชนิดไฟล์และขนาด
    for (const f of files) {
      if (!f.type || !f.type.startsWith("image/")) {
        return NextResponse.json(
          { success: false, error: `ไฟล์ ${f.name} ไม่ใช่รูปภาพ` },
          { status: 400 }
        );
      }
      if (typeof f.size === "number" && f.size > MAX_SIZE) {
        return NextResponse.json(
          { success: false, error: `ไฟล์ ${f.name} มีขนาดเกิน ${Math.floor(MAX_SIZE / (1024 * 1024))}MB` },
          { status: 400 }
        );
      }
    }

    // อัปโหลดขึ้น storage (เช่น Cloudinary) โฟลเดอร์ "contract"
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
