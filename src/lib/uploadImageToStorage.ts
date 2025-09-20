// src/lib/uploadImageToStorage.ts
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";

let _configured = false;
function ensureCloudinaryConfigured() {
  if (_configured) return;
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
    process.env;

  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error(
      "Missing Cloudinary envs (CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET)"
    );
  }
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
  });
  _configured = true;

  if (process.env.NODE_ENV !== "production") {
    // แสดงแค่ว่ามีค่า ไม่ log ค่าเต็ม
    console.log("Cloudinary ready:", {
      cloud_name: CLOUDINARY_CLOUD_NAME,
      api_key: CLOUDINARY_API_KEY ? "✅" : "❌",
      api_secret: CLOUDINARY_API_SECRET ? "✅" : "❌",
    });
  }
}

type SingleUploadOpts = {
  folder?: string;           // โฟลเดอร์บน Cloudinary
  filename?: string;         // public_id (ไม่ต้องใส่นามสกุล)
  overwrite?: boolean;       // default: false
  uniqueFilename?: boolean;  // default: auto จาก filename
  tags?: string[];           // ออปชัน
};

/** อัปโหลดรูปเดียว — คืน secure_url */
export async function uploadImageToStorage(
  file: Blob, // รับ File หรือ Blob ก็ได้
  opts: SingleUploadOpts = {}
): Promise<string> {
  ensureCloudinaryConfigured();

  const {
    folder = "contracts",
    filename,
    overwrite = false,
    uniqueFilename = !filename,
    tags,
  } = opts;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  return new Promise<string>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: filename, // ถ้าส่งมา จะใช้เป็นชื่อไฟล์
        resource_type: "image",
        overwrite,
        unique_filename: uniqueFilename,
        tags,
        // ถ้าต้องการให้ Cloudinary แปลงเป็น webp/avif อัตโนมัติ:
        // format: "auto",
      },
      (error, result?: UploadApiResponse) => {
        if (error || !result) return reject(error);
        resolve(result.secure_url);
      }
    );

    // กัน error ระหว่างส่ง buffer
    stream.on("error", reject);
    stream.end(buffer);
  });
}

type MultiUploadOpts = {
  folder?: string;
  prefix?: string; // คำนำหน้าชื่อไฟล์
};

/** อัปโหลดหลายรูป — คืน array ของ secure_url */
export async function uploadManyImagesToStorage(
  files: Blob[],
  { folder = "contracts", prefix = "contract" }: MultiUploadOpts = {}
): Promise<string[]> {
  ensureCloudinaryConfigured();
  const now = Date.now();

  const tasks = files.map((f, i) =>
    uploadImageToStorage(f, {
      folder,
      filename: `${prefix}-${now}-${i + 1}`,
      overwrite: false,
      uniqueFilename: false, // เรากำหนดชื่อเองแล้ว
    })
  );
  return Promise.all(tasks);
}
