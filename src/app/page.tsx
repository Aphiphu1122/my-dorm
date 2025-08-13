"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import AboutUsPage from "@/components/about";
import ContactPage from "@/components/contact";

export default function HomePage() {
  const router = useRouter();

  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

  return (
    <div className="min-h-screen bg-white text-black pt-20">
      {/* Header */}
      <header className="fixed top-0 left-0 w-full flex justify-between items-center bg-white px-12 py-4 shadow-md z-50">
        <div className="flex items-center space-x-3">
          <i className="ri-home-heart-fill text-4xl text-blue-900"></i>
          <h1 className="text-2xl font-bold text-blue-900">Dorm</h1>
        </div>
        <nav>
          <ul className="flex space-x-8 text-gray-700 font-medium">
            <li>
              <button
                onClick={() => setShowAboutModal(true)}
                className="hover:text-blue-800 transition duration-200"
              >
                About Us
              </button>
            </li>
            <li>
              <button
                onClick={() => setShowContactModal(true)}
                className="hover:text-blue-800 transition duration-200"
              >
                Contact
              </button>
            </li>
            <li>
              <button
                onClick={() => router.push("/login")}
                className="bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition"
              >
                เข้าสู่ระบบ
              </button>
            </li>
          </ul>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex flex-col items-center justify-center min-h-[85vh] px-6 text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-4 text-blue-900">
          ยินดีต้อนรับสู่ระบบจัดการหอพัก
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mb-8">
          บริหารหอพักง่ายขึ้นสำหรับผู้ดูแล และสะดวกสบายสำหรับผู้เช่า ด้วยระบบครบวงจร
        </p>
        <button
          onClick={() => router.push("/register")}
          className="bg-green-500 text-white text-lg px-6 py-3 rounded-lg shadow hover:bg-green-600 transition"
        >
          สมัครสมาชิก
        </button>
      </main>

      {/* About Modal */}
      {showAboutModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-start pt-20 z-50"
          onClick={() => setShowAboutModal(false)}
        >
          <div
            className="bg-white rounded-xl p-6 max-w-3xl w-full mx-4 shadow-xl relative max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowAboutModal(false)}
              className="absolute top-4 right-4 text-gray-600 hover:text-black text-2xl font-bold"
            >
              &times;
            </button>
            <AboutUsPage />
          </div>
        </div>
      )}

      {/* Contact Modal */}
      {showContactModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-start pt-20 z-50"
          onClick={() => setShowContactModal(false)}
        >
          <div
            className="bg-white rounded-xl p-6 max-w-3xl w-full mx-4 shadow-xl relative max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowContactModal(false)}
              className="absolute top-4 right-4 text-gray-600 hover:text-black text-2xl font-bold"
            >
              &times;
            </button>
            <ContactPage />
          </div>
        </div>
      )}
    </div>
  );
}