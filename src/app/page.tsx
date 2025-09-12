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
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80",
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80&utm_source=chatgpt.com",
  ];

  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div className="relative min-h-screen font-sans">
      {/* พื้นหลังคงที่ */}
      <div
        className="fixed inset-0 bg-fixed bg-cover bg-center z-0"
        style={{ backgroundImage: `url(${images[currentImage]})` }}
      ></div>
      <div className="fixed inset-0 bg-black/60 z-0"></div> {/* overlay */}

      {/* Header */}
      <header
        className="fixed top-0 left-0 w-full flex justify-between items-center 
        bg-white/10 backdrop-blur-xl border-b border-white/20
        px-12 py-4 shadow-lg z-50 text-white"
      >
        <div className="flex items-center space-x-3">
          <i className="ri-home-heart-fill text-4xl text-teal-300 drop-shadow"></i>
          <h1 className="text-2xl font-extrabold drop-shadow">ระบบจัดการหอพัก</h1>
        </div>
        <nav className="flex items-center space-x-8">
          <button
            onClick={() => {
              setShowAboutModal(true);
              setShowContactModal(false);
            }}
            className="relative font-medium hover:text-teal-300 transition 
              after:content-[''] after:block after:h-[2px] after:w-0 hover:after:w-full 
              after:bg-teal-300 after:transition-all"
          >
            เกี่ยวกับเรา
          </button>

          <button
            onClick={() => {
              setShowContactModal(true);
              setShowAboutModal(false);
            }}
            className="relative font-medium hover:text-teal-300 transition 
              after:content-[''] after:block after:h-[2px] after:w-0 hover:after:w-full 
              after:bg-teal-300 after:transition-all"
          >
            ติดต่อเรา
          </button>

          <button
            onClick={() => router.push("/login")}
            className="bg-gradient-to-r from-teal-400/80 to-blue-500/80 text-white px-6 py-2 
              rounded-full shadow-md hover:scale-105 hover:shadow-lg transition-all"
          >
            เข้าสู่ระบบ
          </button>
        </nav>
      </header>

      {/* Hero */}
      <main className="relative h-screen text-center flex flex-col justify-center items-center px-4 z-10">
        <h2 className="text-5xl md:text-6xl font-extrabold mb-6 leading-snug text-white drop-shadow-2xl">
          ระบบจัดการหอพัก <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-blue-400 to-indigo-400 animate-pulse">
            สะดวก รวดเร็ว ครบจบในที่เดียว
          </span>
        </h2>

        <p className="text-lg md:text-xl text-gray-200 max-w-2xl mx-auto mb-10 drop-shadow-lg">
          บริหารจัดการหอพักได้ง่ายขึ้นสำหรับผู้ดูแล และเพิ่มความสะดวกให้ผู้เช่าด้วยระบบครบวงจร
        </p>

        <button
            onClick={() => router.push("/login")}
            className="bg-gradient-to-r from-teal-400/80 to-blue-500/80 text-white px-6 py-2 
              rounded-full shadow-md hover:scale-105 hover:shadow-lg transition-all"
          >
            เข้าสู่ระบบ
          </button>
      </main>

      {/* Modal About */}
      {showAboutModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl p-8 relative animate-fade-in">
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
      <section className="py-20 px-6 text-center relative z-10">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-14 drop-shadow-lg">
          ฟีเจอร์เด่นของระบบหอพัก
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl mx-auto ">
          {[
            {
              icon: "ri-home-smile-line",
              color: "text-blue-500",
              title: "รอบัญชีจากแอดมินได้เลย",
              desc: "ผู้เช่าสามารถรับบัญชีจากแอดมินและเข้าสู่ระบบได้ทันที",
            },
            {
              icon: "ri-tools-line",
              color: "text-yellow-400",
              title: "แจ้งซ่อมออนไลน์",
              desc: "แจ้งปัญหาพร้อมแนบรูปภาพได้ทุกที่ทุกเวลา",
            },
            {
              icon: "ri-file-list-3-line",
              color: "text-green-400",
              title: "ดูบิลและแนบสลิป",
              desc: "ตรวจสอบค่าใช้จ่ายและชำระเงินผ่านระบบได้อย่างง่ายดาย",
            },
            {
              icon: "ri-history-line",
              color: "text-indigo-400",
              title: "ประวัติการชำระเงิน",
              desc: "ดูรายการบิลที่เคยชำระย้อนหลังได้ทุกเมื่อ",
            },
            {
              icon: "ri-file-pdf-line",
              color: "text-red-400",
              title: "ใบเสร็จ อัตโนมัติ",
              desc: "ดาวน์โหลดใบเสร็จค่าเช่าเพื่อเก็บไว้ได้",
            },
            {
              icon: "ri-notification-2-line",
              color: "text-orange-400",
              title: "แจ้งเตือนอัตโนมัติ",
              desc: "ไม่พลาดทุกการอัปเดต เช่น บิลใหม่ และสถานะแจ้งซ่อม",
            },
          ].map((f, i) => (
            <div
              key={i}
              className="bg-white/90 rounded-2xl p-8 shadow-md hover:shadow-xl hover:scale-105 transition-transform duration-300 cursor-pointer border border-white/20 backdrop-blur-sm"
            >
              <i className={`${f.icon} text-5xl ${f.color} mb-6 drop-shadow`}></i>
              <h4 className="text-xl font-semibold mb-3 text-gray-800">{f.title}</h4>
              <p className="text-gray-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-6 text-center relative z-10">
        <h3 className="text-3xl font-bold text-white mb-10 drop-shadow-md">
          เสียงจากผู้ใช้งานจริง
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <blockquote className="p-6 border-l-4 border-teal-300 bg-white/90 backdrop-blur-sm rounded shadow hover:shadow-md transition">
            <p className="text-gray-700 italic">
              ระบบนี้ช่วยให้ฉันจัดการห้องพักได้ง่ายขึ้นมาก
            </p>
            <span className="block mt-4 font-semibold text-teal-600">
              – คุณสมชาย, ผู้ดูแลหอ
            </span>
          </blockquote>
          <blockquote className="p-6 border-l-4 border-green-400 bg-white/90 backdrop-blur-sm rounded shadow hover:shadow-md transition">
            <p className="text-gray-700 italic">
              แจ้งซ่อมออนไลน์สะดวกสุดๆ ไม่ต้องเดินไปที่ออฟฟิศเลย
            </p>
            <span className="block mt-4 font-semibold text-green-600">
              – น.ส. ใจดี, ผู้เช่า
            </span>
          </blockquote>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-6 text-left max-w-4xl mx-auto relative z-10">
        <h3 className="text-3xl font-bold text-white mb-8 text-center drop-shadow-md">
          คำถามที่พบบ่อย
        </h3>
        <div className="space-y-6 bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
          <div>
            <h4 className="font-semibold text-lg text-gray-800">ได้บัญชีแล้วต้องทำอะไรบ้าง</h4>
            <p className="text-gray-700">คุณสามารถเข้าสู่ระบบและใช้งานได้ทันที และ เปลี่ยนรหัสผ่านเป็นของคุณได้เลย</p>
          </div>
          <div>
            <h4 className="font-semibold text-lg text-gray-800">ชำระค่าเช่าผ่านช่องทางไหนได้บ้าง?</h4>
            <p className="text-gray-700">คุณสามารถโอนเงินผ่านแอปธนาคาร และแนบสลิปการชำระเงินผ่านระบบได้เลย</p>
          </div>
          <div>
            <h4 className="font-semibold text-lg text-gray-800">ข้อมูลของฉันปลอดภัยหรือไม่?</h4>
            <p className="text-gray-700">ระบบของเราเข้ารหัสข้อมูลอย่างปลอดภัย และไม่มีการเปิดเผยข้อมูลให้บุคคลภายนอก</p>
          </div>
          <div>
            <h4 className="font-semibold text-lg text-gray-800">สามารถดูบิลย้อนหลังได้ไหม?</h4>
            <p className="text-gray-700">ได้แน่นอน! คุณสามารถเข้าดูประวัติการชำระเงินและใบเสร็จย้อนหลังได้ตลอดเวลา</p>
          </div>
          <div>
            <h4 className="font-semibold text-lg text-gray-800">ถ้าต้องการย้ายออก ต้องแจ้งล่วงหน้ากี่วัน?</h4>
            <p className="text-gray-700">โปรดแจ้งผู้ดูแลหอล่วงหน้าอย่างน้อย 30 วัน เพื่อดำเนินการตรวจสอบห้องและจัดการเรื่องมัดจำ</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white/10 backdrop-blur-xl border-t border-white/20 text-white text-center py-6 mt-12 shadow-lg relative z-10">
        <p>&copy; {new Date().getFullYear()} ระบบจัดการหอพัก. สงวนลิขสิทธิ์</p>
      </footer>
    </div>
  );
}
