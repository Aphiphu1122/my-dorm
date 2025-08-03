import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      "s.isanook.com",
      "bcdn.renthub.in.th",
      "res.cloudinary.com", // ✅ เพิ่ม domain ของ Cloudinary ตรงนี้
    ],
  },
};

export default nextConfig;