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
      <header className="fixed top-0 left-0 w-full flex justify-between items-center bg-white px-20 py-4 shadow-md z-50">
        <div className="flex items-center space-x-2">
          <i className="ri-home-heart-fill text-4xl text-blue-950"></i>
          <h4 className="text-xl font-semibold">Dorm</h4>
        </div>
        <nav>
          <ul className="flex space-x-8 text-gray-700 font-semibold">
            <li>
              <button
                onClick={() => setShowAboutModal(true)}
                className="hover:text-blue-950 transition"
              >
                About Us
              </button>
            </li>
            <li>
              <button
                onClick={() => setShowContactModal(true)}
                className="hover:text-blue-950 transition"
              >
                Contact
              </button>
            </li>
          </ul>
        </nav>
      </header>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-[80vh]">
        <button
          onClick={() => router.push("/login")}
          className="px-6 py-3 bg-green-500 text-white text-lg rounded hover:bg-blue-700 transition"
        >
          ไปหน้า Login
        </button>
      </div>

      {/* Modal: About Us */}
      {showAboutModal && (
        <div
          className="fixed inset-0 bg-white bg-opacity-70 flex justify-center items-start pt-20 z-50 overflow-auto"
          onClick={() => setShowAboutModal(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 max-w-3xl w-full mx-4 shadow-lg relative max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowAboutModal(false)}
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 text-3xl font-bold"
              aria-label="Close modal"
            >
              &times;
            </button>
            <AboutUsPage />
          </div>
        </div>
      )}

      {/* Modal: Contact */}
      {showContactModal && (
        <div
          className="fixed inset-0 bg-white bg-opacity-70 flex justify-center items-start pt-20 z-50 overflow-auto"
          onClick={() => setShowContactModal(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 max-w-3xl w-full mx-4 shadow-lg relative max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowContactModal(false)}
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 text-3xl font-bold"
              aria-label="Close modal"
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
