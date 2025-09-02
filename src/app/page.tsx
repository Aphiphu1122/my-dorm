"use client";
 
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import AboutUsPage from "@/components/about";
import ContactPage from "@/components/contact";
 
export default function HomePage() {
  const router = useRouter();
 
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
 
  const images = [
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80",   
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80",  
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80&utm_source=chatgpt.com"

];
 
  const [currentImage, setCurrentImage] = useState(0);
 
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [images.length]);
 
  return (
    <div className="min-h-screen bg-white text-black font-sans">
          {/* Header */}
          <header className="fixed top-0 left-0 w-full flex justify-between items-center 
      bg-white/40 backdrop-blur-md border-b border-white/20
      px-12 py-4 shadow-lg z-50 transition">
      <div className="flex items-center space-x-3">
        <i className="ri-home-heart-fill text-4xl text-blue-700"></i>
        <h1 className="text-2xl font-extrabold text-blue-900">Dorm</h1>
      </div>
      <nav className="flex items-center space-x-8">
        <button
          onClick={() => {
            setShowAboutModal(true);
            setShowContactModal(false);
          }}
          className="relative font-medium text-white hover:text-blue-200 transition 
            after:content-[''] after:block after:h-[2px] after:w-0 hover:after:w-full 
            after:bg-blue-200 after:transition-all"
        >
          About Us
        </button>

        <button
          onClick={() => {
            setShowContactModal(true);
            setShowAboutModal(false);
          }}
          className="relative font-medium text-white hover:text-blue-200 transition 
            after:content-[''] after:block after:h-[2px] after:w-0 hover:after:w-full 
            after:bg-blue-200 after:transition-all"
        >
          Contact
        </button>

        <button
          onClick={() => router.push("/login")}
          className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-6 py-2 
            rounded-full shadow-md hover:scale-105 hover:shadow-lg transition-all"
        >
          Sign in
        </button>
      </nav>
    </header>


      {/* Hero */}
      <main className="relative h-screen text-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-in-out"
          style={{ backgroundImage: `url(${images[currentImage]})` }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70"></div>
 
        {/* Content */}
        <div className="relative flex flex-col items-center justify-center h-full px-4 text-white">
          <h2 className="text-5xl md:text-5xl font-extrabold mb-6 leading-snug drop-shadow-lg">
            MY DORM <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-blue-400 to-indigo-400 animate-pulse">
              Welcome to the dormitory management system
            </span>
          </h2>
 
          <p className="text-lg md:text-xl text-gray-200 max-w-2xl mx-auto mb-10 drop-shadow-md">
            Make dormitory management easier for administrators and more convenient for tenants with an all-in-one system.
          </p>
 
          <button
            onClick={() => router.push("/register")}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-emerald-600 hover:to-green-500
                      text-white text-lg px-10 py-4 rounded-2xl shadow-xl
                      transform hover:scale-110 transition duration-300 ease-out"
          >
            Sign up
          </button>
        </div>
      </main>
 
      {/* Modal About */}
{showAboutModal && (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
    <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl p-8 relative animate-fade-in">
      {/* ปุ่มปิด */}
      <button
        onClick={() => setShowAboutModal(false)}
        className="absolute top-4 right-4 text-gray-500 hover:text-black text-3xl font-bold w-10 h-10 rounded-full flex items-center justify-center transition"
      >
        ×
      </button>
      <AboutUsPage />
    </div>
  </div>
)}
 
{/* Modal Contact */}
{showContactModal && (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
    <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl p-8 relative animate-fade-in">
      {/* ปุ่มปิด */}
      <button
        onClick={() => setShowContactModal(false)}
        className="absolute top-4 right-4 text-gray-500 hover:text-black text-3xl font-bold w-10 h-10 rounded-full flex items-center justify-center transition"
      >
        ×
      </button>
      <ContactPage />
    </div>
  </div>
)}
 
 
      {/* Features */}
      <section className="bg-gray-50 py-20 px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-blue-900 mb-14">
          ฟีเจอร์เด่นของระบบหอพัก
        </h2>
 
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl mx-auto ">
          {[
            {
              icon: "ri-home-smile-line",
              color: "text-blue-700",
              title: "สมัครผู้ใช้",
              desc: "ผู้เช่าสามารถดูห้องว่างและเลือกห้องได้ทันทีผ่านระบบ",
            },
            {
              icon: "ri-tools-line",
              color: "text-yellow-600",
              title: "แจ้งซ่อมออนไลน์",
              desc: "แจ้งปัญหาพร้อมแนบรูปภาพได้ทุกที่ทุกเวลา",
            },
            {
              icon: "ri-file-list-3-line",
              color: "text-green-600",
              title: "ดูบิลและแนบสลิป",
              desc: "ตรวจสอบค่าใช้จ่ายและชำระเงินผ่านระบบได้อย่างง่ายดาย",
            },
            {
              icon: "ri-history-line",
              color: "text-indigo-600",
              title: "ประวัติการชำระเงิน",
              desc: "ดูรายการบิลที่เคยชำระย้อนหลังได้ทุกเมื่อ",
            },
            {
              icon: "ri-file-pdf-line",
              color: "text-red-500",
              title: "ใบเสร็จ อัตโนมัติ",
              desc: "ดาวน์โหลดใบเสร็จค่าเช่าเพื่อเก็บไว้ได้",
            },
            {
              icon: "ri-notification-2-line",
              color: "text-orange-500",
              title: "แจ้งเตือนอัตโนมัติ",
              desc: "ไม่พลาดทุกการอัปเดต เช่น บิลใหม่ และสถานะแจ้งซ่อม",
            },
          ].map((f, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-8 shadow-md hover:shadow-lg hover:scale-105 transition-transform duration-300 cursor-pointer"
            >
              <i className={`${f.icon} text-5xl ${f.color} mb-6`}></i>
              <h4 className="text-xl font-semibold mb-3">{f.title}</h4>
              <p className="text-gray-600">{f.desc}</p>
            </div>
          ))}
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
            <span className="block mt-4 font-semibold text-green-800">– น.ส. ใจดี, ผู้เช่า</span>
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
 
 
      {/* Footer */}
      <footer className="bg-gradient-to-r from-blue-900 to-blue-700 text-white text-center py-6 mt-12">
        <p>
          &copy; {new Date().getFullYear()} Dorm Management System. All rights
          reserved.
        </p>
      </footer>
    </div>
  );
}