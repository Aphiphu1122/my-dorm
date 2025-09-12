'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import AboutUsPage from "@/components/about";
import ContactPage from "@/components/contact";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg("");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "เข้าสู่ระบบไม่สำเร็จ");
        return;
      }

      toast.success("เข้าสู่ระบบสำเร็จ");

      const role = data.user?.role || "user";
      router.push(role === "admin" ? "/admin/dashboard" : "/home");

    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "เกิดข้อผิดพลาดระหว่างเข้าสู่ระบบ");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px]">
      {/* Header */}
      <header className="w-full fixed top-0 left-0 right-0 flex justify-between items-center backdrop-blur-md bg-white/70 px-20 py-4 shadow-lg z-50 rounded-b-2xl">
        <div className="flex items-center space-x-2">
          <i className="ri-home-heart-fill text-4xl text-blue-900 drop-shadow-sm"></i>
          <h4 className="text-xl text-blue-950 font-bold">Dorm</h4>
        </div>
        <nav>
          <ul className="flex space-x-10 text-gray-700 font-semibold">
            <li>
              <button
                onClick={() => setShowAboutModal(true)}
                className="hover:text-blue-900 transition relative after:block after:h-[2px] after:bg-blue-600 after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:origin-left"
              >
                เกี่ยวกับเรา
              </button>
            </li>
            <li>
              <button
                onClick={() => setShowContactModal(true)}
                className="hover:text-blue-900 transition relative after:block after:h-[2px] after:bg-blue-600 after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:origin-left"
              >
                ติดต่อเรา
              </button>
            </li>
          </ul>
        </nav>
      </header>

      {/* Content */}
      <div className="flex flex-col md:flex-row justify-center items-center w-full max-w-6xl mx-auto mt-32 px-6 py-12 gap-12">
        {/* Left Section */}
        <div className="md:w-1/2 text-center md:text-left space-y-6">
          <h1 className="text-5xl font-extrabold text-blue-950 drop-shadow-md">
            MyDorm
          </h1>
          <p className="text-gray-700 text-lg">
            ระบบจัดการหอพักที่ใช้งานง่ายสำหรับทุกคน
          </p>
          <p className="text-gray-800">
            ยังไม่มีบัญชีผู้ใช้?{" "}
            <a
              href=""
              className="text-blue-700 hover:underline font-semibold"
            >
              โปรดติดต่อเจ้าของหอพักเพื่อรับ Account
            </a>
          </p>
        </div>

        {/* Login Form */}
        <form
          onSubmit={handleLogin}
          className="backdrop-blur-lg bg-white/80 p-10 rounded-2xl shadow-2xl w-full md:w-1/2 max-w-md border border-white/40"
        >
          <h2 className="text-3xl font-bold mb-3 text-center text-blue-950">
            เข้าสู่ระบบ
          </h2>
          <h3 className="text-gray-500 mb-6 text-center">
            ลงชื่อเข้าใช้เพื่อจัดการบัญชีของคุณ
          </h3>

          {errorMsg && (
            <p className="text-red-600 text-sm mb-4 text-center">{errorMsg}</p>
          )}

          <div className="mb-5">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              อีเมล
            </label>
            <div className="flex items-center border rounded-md px-3 py-2 bg-white/70 focus-within:ring-2 focus-within:ring-blue-400">
              <i className="ri-mail-fill text-gray-400 mr-2"></i>
              <input
                id="email"
                type="email"
                className="flex-1 bg-transparent outline-none text-gray-900"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="กรอกอีเมลของคุณ"
                required
              />
            </div>
          </div>

          <div className="mb-8">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              รหัสผ่าน
            </label>
            <div className="flex items-center border rounded-md px-3 py-2 bg-white/70 focus-within:ring-2 focus-within:ring-blue-400">
              <i className="ri-lock-password-fill text-gray-400 mr-2"></i>
              <input
                id="password"
                type="password"
                className="flex-1 bg-transparent outline-none text-gray-900"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="กรอกรหัสผ่านของคุณ"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!(email && password)}
            className={`w-full py-3 rounded-full font-semibold shadow-md transition-all ${
              email && password
                ? "bg-gradient-to-r from-blue-600 to-indigo-700 text-white hover:scale-105 hover:shadow-xl"
                : "bg-gray-400 text-white cursor-not-allowed"
            }`}
          >
            เข้าสู่ระบบ
          </button>
        </form>
      </div>

      {/* Modal: About Us */}
      {showAboutModal && (
        <div
          className="fixed inset-0 bg-black/40 flex justify-center items-center z-50"
          onClick={() => setShowAboutModal(false)}
        >
          <div
            className="bg-white/90 backdrop-blur-lg rounded-3xl p-6 max-w-3xl w-full mx-4 shadow-2xl relative animate-[fadeIn_0.3s_ease-out]"
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
          className="fixed inset-0 bg-black/40 flex justify-center items-center z-50"
          onClick={() => setShowContactModal(false)}
        >
          <div
            className="bg-white/90 backdrop-blur-lg rounded-3xl p-6 max-w-3xl w-full mx-4 shadow-2xl relative animate-[fadeIn_0.3s_ease-out]"
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
