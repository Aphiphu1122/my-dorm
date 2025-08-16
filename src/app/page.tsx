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
       <div className="min-h-screen bg-white text-black pt-20 font-sans">
      {/* Header */}
      <header className="fixed top-0 left-0 w-full flex justify-between items-center bg-white/90 backdrop-blur px-12 py-3 shadow-md z-50">
        <div className="flex items-center space-x-3">
          <i className="ri-home-heart-fill text-4xl text-blue-900"></i>
          <h1 className="text-2xl font-bold text-blue-900">Dorm</h1>
        </div>
        <nav className="flex items-center space-x-6">
          <button
            onClick={() => {
              setShowAboutModal(true);
              setShowContactModal(false);
            }}
            className="text-gray-700 hover:text-blue-800 font-medium transition duration-200"
          >
            About Us
          </button>
          <button
            onClick={() => {
              setShowContactModal(true);
              setShowAboutModal(false);
            }}
            className="text-gray-700 hover:text-blue-800 font-medium transition duration-200"
          >
            Contact
          </button>
          <button
            onClick={() => router.push("/login")}
            className="bg-blue-600 text-white px-5 py-2 rounded-full hover:bg-blue-700 transition font-semibold"
          >
            เข้าสู่ระบบ
          </button>
        </nav>
      </header>

      {/* Hero */}
      <main className="px-6 text-center mt-20 mb-16">
        <h2 className="text-4xl md:text-5xl font-bold mb-4 text-blue-900 leading-snug">
          MY DORM <br />
          ยินดีต้อนรับสู่ระบบจัดการหอพัก
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
          บริหารหอพักง่ายขึ้นสำหรับผู้ดูแล และสะดวกสบายสำหรับผู้เช่า ด้วยระบบครบวงจร
        </p>
        <button
          onClick={() => router.push("/register")}
          className="bg-green-500 text-white text-lg px-6 py-3 rounded-lg shadow hover:bg-green-600 transition"
        >
          สมัครสมาชิก
        </button>
      </main>

      {/* Modal About */}
      {showAboutModal && (
        <section className="max-w-6xl mx-auto my-12 px-6 animate-fade-in bg-white/90 backdrop-blur-md rounded-lg shadow-lg py-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-blue-900">เกี่ยวกับเรา</h2>
            <button
              onClick={() => setShowAboutModal(false)}
              className="text-gray-500 hover:text-black text-4xl font-bold w-12 h-12 rounded-full flex items-center justify-center transition"
            >
              ×
            </button>
          </div>
          <AboutUsPage />
        </section>
      )}

      {/* Modal Contact */}
      {showContactModal && (
        <section className="max-w-6xl mx-auto my-12 px-6 animate-fade-in bg-white/90 backdrop-blur-md rounded-lg shadow-lg py-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-blue-900">ติดต่อเรา</h2>
            <button
              onClick={() => setShowContactModal(false)}
              className="text-gray-500 hover:text-black text-4xl font-bold w-12 h-12 rounded-full flex items-center justify-center transition"
            >
              ×
            </button>
          </div>
          <ContactPage />
        </section>
      )}

      <section className="bg-gray-100 py-16 px-4 text-center">
      <h2 className="text-3xl md:text-4xl font-bold text-blue-900 mb-12">ฟีเจอร์เด่นของระบบหอพัก</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {/* ฟีเจอร์ 1 */}
        <div className="bg-white rounded-2xl p-6 shadow hover:shadow-lg transition">
          <i className="ri-home-smile-line text-4xl text-blue-700 mb-4"></i>
          <h4 className="text-xl font-semibold mb-2">สมัครผู้ใช้</h4>
          <p className="text-gray-600">ผู้เช่าสามารถดูห้องว่างและเลือกห้องได้ทันทีผ่านระบบ</p>
        </div>

        {/* ฟีเจอร์ 2 */}
        <div className="bg-white rounded-2xl p-6 shadow hover:shadow-lg transition">
          <i className="ri-tools-line text-4xl text-yellow-600 mb-4"></i>
          <h4 className="text-xl font-semibold mb-2">แจ้งซ่อมออนไลน์</h4>
          <p className="text-gray-600">แจ้งปัญหาพร้อมแนบรูปภาพได้ทุกที่ทุกเวลา</p>
        </div>

        {/* ฟีเจอร์ 3 */}
        <div className="bg-white rounded-2xl p-6 shadow hover:shadow-lg transition">
          <i className="ri-file-list-3-line text-4xl text-green-600 mb-4"></i>
          <h4 className="text-xl font-semibold mb-2">ดูบิลและแนบสลิป</h4>
          <p className="text-gray-600">ตรวจสอบค่าใช้จ่ายและชำระเงินผ่านระบบได้อย่างง่ายดาย</p>
        </div>

        {/* ฟีเจอร์ 4 */}
        <div className="bg-white rounded-2xl p-6 shadow hover:shadow-lg transition">
          <i className="ri-history-line text-4xl text-indigo-600 mb-4"></i>
          <h4 className="text-xl font-semibold mb-2">ประวัติการชำระเงิน</h4>
          <p className="text-gray-600">ดูรายการบิลที่เคยชำระย้อนหลังได้ทุกเมื่อ</p>
        </div>

        {/* ฟีเจอร์ 5 */}
        <div className="bg-white rounded-2xl p-6 shadow hover:shadow-lg transition">
          <i className="ri-file-pdf-2-line text-4xl text-red-500 mb-4"></i>
          <h4 className="text-xl font-semibold mb-2">ใบเสร็จ PDF</h4>
          <p className="text-gray-600">ดาวน์โหลดใบเสร็จค่าเช่าเพื่อเก็บไว้ได้ในรูปแบบ PDF</p>
        </div>

        {/* ฟีเจอร์ 6 */}
        <div className="bg-white rounded-2xl p-6 shadow hover:shadow-lg transition">
          <i className="ri-notification-2-line text-4xl text-orange-500 mb-4"></i>
          <h4 className="text-xl font-semibold mb-2">แจ้งเตือนอัตโนมัติ</h4>
          <p className="text-gray-600">ไม่พลาดทุกการอัปเดต เช่น บิลใหม่ และสถานะแจ้งซ่อม</p>
        </div>
      </div>
    </section>

      {/* Testimonials */}
      <section className="py-16 bg-white px-6 text-center">
        <h3 className="text-3xl font-bold text-blue-900 mb-10">เสียงจากผู้ใช้จริง</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <blockquote className="p-6 border-l-4 border-blue-500 bg-gray-50 rounded shadow">
            <p className="text-gray-700 italic">
              ระบบนี้ช่วยให้ฉันจัดการห้องพักได้ง่ายขึ้นมาก
            </p>
            <span className="block mt-4 font-semibold text-blue-800">– คุณสมชาย, ผู้ดูแลหอ</span>
          </blockquote>
          <blockquote className="p-6 border-l-4 border-green-500 bg-gray-50 rounded shadow">
            <p className="text-gray-700 italic">
              แจ้งซ่อมออนไลน์สะดวกสุดๆ ไม่ต้องเดินไปที่ออฟฟิศเลย
            </p>
            <span className="block mt-4 font-semibold text-green-800">– น.ส. สายไหม, ผู้เช่า</span>
          </blockquote>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-gray-100 px-6 text-left max-w-4xl mx-auto">
        <h3 className="text-3xl font-bold text-blue-900 mb-8 text-center">คำถามที่พบบ่อย</h3>
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-lg">Q: สมัครสมาชิกแล้วต้องรออนุมัติไหม?</h4>
            <p className="text-gray-700">A: ไม่ต้องรอ! คุณสามารถเข้าสู่ระบบและใช้งานได้ทันทีหลังจากสมัคร</p>
          </div>
          <div>
            <h4 className="font-semibold text-lg">Q: ชำระค่าเช่าผ่านช่องทางไหนได้บ้าง?</h4>
            <p className="text-gray-700">A: คุณสามารถโอนเงินผ่านแอปธนาคาร และแนบสลิปการชำระเงินผ่านระบบได้เลย</p>
          </div>
          <div>
            <h4 className="font-semibold text-lg">Q: ข้อมูลของฉันปลอดภัยหรือไม่?</h4>
            <p className="text-gray-700">A: ระบบของเราเข้ารหัสข้อมูลอย่างปลอดภัย และไม่มีการเปิดเผยข้อมูลให้บุคคลภายนอก</p>
          </div>
          <div>
            <h4 className="font-semibold text-lg">Q: สามารถดูบิลย้อนหลังได้ไหม?</h4>
            <p className="text-gray-700">A: ได้แน่นอน! คุณสามารถเข้าดูประวัติการชำระเงินและใบเสร็จย้อนหลังได้ตลอดเวลา</p>
          </div>
          <div>
            <h4 className="font-semibold text-lg">Q: ถ้าต้องการย้ายออก ต้องแจ้งล่วงหน้ากี่วัน?</h4>
            <p className="text-gray-700">A: โปรดแจ้งผู้ดูแลหอล่วงหน้าอย่างน้อย 30 วัน เพื่อดำเนินการตรวจสอบห้องและจัดการเรื่องมัดจำ</p>
          </div>
        </div>
      </section>

      <footer className="bg-blue-950 text-white text-center py-6 mt-12">
        <p>&copy; {new Date().getFullYear()} Dorm Management System. All rights reserved.</p>
      </footer>
    </div>
  );
}
