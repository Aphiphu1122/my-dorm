'use client';

import { useEffect, useState } from 'react';
<<<<<<< HEAD
import Image from 'next/image';
=======
>>>>>>> 5d40da917da510b1dc3daacae3b41b1fa6cc8096
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
<<<<<<< HEAD
          <Image
            src={images[current]}
            alt={`Dorm image ${current + 1}`}
            fill
            className="object-cover transition-all duration-500 rounded-xl"
            sizes="(max-width: 768px) 100vw, 60vw"
=======
          <img
            src={images[current]}
            alt={`Dorm image ${current + 1}`}
            className="w-full h-full object-cover transition-all duration-500"
>>>>>>> 5d40da917da510b1dc3daacae3b41b1fa6cc8096
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
          <h1 className="text-2xl font-bold text-blue-900 mb-4">About Us</h1>
          <p className="mb-4 text-lg leading-relaxed">
            <span className="font-semibold text-blue-700">Dorm</span> is a platform designed to simplify dormitory management and room searching for both tenants and landlords. Fast, easy, and secure.
          </p>
          <ul className="list-disc list-inside space-y-2 text-base">
            <li>Instantly add, edit, and remove dormitory data</li>
            <li>Search by location, price, and room type</li>
            <li>Verified users and real reviews</li>
          </ul>
          <p className="mt-6 text-sm">
            Contact us:{" "}
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
