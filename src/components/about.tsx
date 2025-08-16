'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import 'remixicon/fonts/remixicon.css';

const images = [
  "https://s.isanook.com/wo/0/ud/42/210425/210425-20221223071830-5775dce.jpg?ip/resize/w728/q80/jpg",
  "https://bcdn.renthub.in.th/listing_picture/202401/20240119/W2E2K69JvJqgFauZ97By.jpg?class=doptimized",
  "https://bcdn.renthub.in.th/listing_picture/202401/20240119/k1yEnWMSYs79VVSeugmi.jpg?class=doptimized",
];

export default function AboutUsPage() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const goPrev = () => {
    setCurrent((prev) => (prev - 1 + images.length) % images.length);
  };

  const goNext = () => {
    setCurrent((prev) => (prev + 1) % images.length);
  };

  return (
    <div className="bg-white px-6 py-8">
      <div className="flex flex-col md:flex-row items-center max-w-7xl mx-auto gap-10">
        {/* Image carousel */}
        <div className="relative w-full md:w-[60%] h-[400px] rounded-xl overflow-hidden shadow-lg">
          <Image
            src={images[current]}
            alt={`Dorm image ${current + 1}`}
            fill
            className="object-cover transition-all duration-500 rounded-xl"
            sizes="(max-width: 768px) 100vw, 60vw"
          />
          <button
            onClick={goPrev}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 shadow-md transition"
            aria-label="Previous Image"
          >
            <i className="ri-arrow-left-s-line text-2xl text-gray-700"></i>
          </button>
          <button
            onClick={goNext}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 shadow-md transition"
            aria-label="Next Image"
          >
            <i className="ri-arrow-right-s-line text-2xl text-gray-700"></i>
          </button>
        </div>

        {/* Text content */}
        <div className="w-full md:w-[40%] text-gray-800">
          <h1 className="text-2xl font-bold text-blue-900 mb-4">เกี่ยวกับเรา</h1>
          <p className="mb-4 text-lg leading-relaxed">
            <span className="font-semibold text-blue-700">Dorm</span> คือระบบจัดการหอพักออนไลน์
            ที่ออกแบบมาเพื่อให้ทั้งเจ้าของหอและผู้เช่าใช้งานได้ง่าย รวดเร็ว และปลอดภัย
          </p>
          <ul className="list-disc list-inside space-y-2 text-base">
            <li>เจ้าของหอสามารถเพิ่ม ลบ และจัดการข้อมูลห้องพักได้ทันที</li>
            <li>ผู้เช่าดูสถานะห้องว่างและแจ้งซ่อมออนไลน์ได้สะดวก</li>
            <li>ระบบแสดงบิล รายการชำระ และแนบสลิปในไม่กี่คลิก</li>
          </ul>
          <p className="mt-6 text-sm">
            ติดต่อเรา:{" "}
            <a
              href="mailto:support@mydorm.com"
              className="text-blue-600 underline hover:text-blue-800"
            >
              support@mydorm.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
