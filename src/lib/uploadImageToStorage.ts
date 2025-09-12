import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

// อย่า log secret ใน production จริง ๆ นะครับ
if (process.env.NODE_ENV !== "production") {
  console.log("Cloudinary config:", {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY ? "✅" : "❌",
    api_secret: process.env.CLOUDINARY_API_SECRET ? "✅" : "❌",
  });
}

export async function uploadImageToStorage(
  file: File,
  filename?: string,
  folder = "contracts" // ใช้โฟลเดอร์สำหรับสัญญา (เดิมคุณตั้ง "maintenance")
): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: filename,           // ไม่ใส่ก็ให้ Cloudinary gen เอง
        resource_type: "image",
        overwrite: false,
        unique_filename: !filename,    // ถ้าไม่มีชื่อ ให้สุ่มชื่อไม่ชน
      },
      (error, result) => {
        if (error || !result) return reject(error);
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

export async function uploadManyImagesToStorage(files: File[], prefix = "contract"): Promise<string[]> {
  const now = Date.now();
  const tasks = files.map((f, idx) =>
    uploadImageToStorage(f, `${prefix}-${now}-${idx + 1}`, "contracts")
  );
  return Promise.all(tasks);
}
