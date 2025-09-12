"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { toast } from "react-hot-toast";
import NotificationBell from "@/components/NotificationBell";
import Sidebar from "@/components/sidebar";

type Bill = {
  id: string;
  billingMonth: string;
  totalAmount: number;
  status: "PAID" | "UNPAID" | "PENDING_APPROVAL";
};

type Notification = {
  id: string;
  message: string;
  createdAt: string;
  read: boolean;
};

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  rentAmount: number;
  room?: {
    roomNumber: string;
    rentAmount?: number;
  };
}

const bannerImages = [
  "https://i.ytimg.com/vi/N9mpV2Muv8k/maxresdefault.jpg",
  "https://s.isanook.com/wo/0/ud/42/210425/210425-20221223071830-5775dce.jpg?ip/resize/w728/q80/jpg",
  "https://bcdn.renthub.in.th/listing_picture/202401/20240119/W2E2K69JvJqgFauZ97By.jpg?class=doptimized",
];

export default function HomePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Banner states
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHover, setIsHover] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const goPrev = () =>
    setCurrentIndex((i) => (i === 0 ? bannerImages.length - 1 : i - 1));
  const goNext = () =>
    setCurrentIndex((i) => (i === bannerImages.length - 1 ? 0 : i + 1));

  useEffect(() => {
    if (isHover || bannerImages.length <= 1) return;
    const id = setInterval(goNext, 4000);
    return () => clearInterval(id);
  }, [isHover]);

  useEffect(() => {
    const fetchProfile = async () => {
      const res = await fetch("/api/profile/me");
      if (!res.ok) return toast.error("ไม่สามารถโหลดข้อมูลผู้ใช้ได้");
      const data = await res.json();

      setUser({
        ...data,
        rentAmount: data?.room?.rentAmount ?? data?.rentAmount ?? 3000,
      });
    };

    const fetchBills = async () => {
      const res = await fetch("/api/bills");
      if (!res.ok) return toast.error("ไม่สามารถโหลดข้อมูลบิลได้");
      const data = await res.json();
      setBills(Array.isArray(data.bills) ? data.bills : []);
    };

    const fetchNotifications = async () => {
      const res = await fetch("/api/notifications/me");
      if (!res.ok) return;
      const data = await res.json();
      const notiArray = Array.isArray(data) ? data : data.notifications;
      if (!Array.isArray(notiArray)) return;

      setNotifications(notiArray);
    };

    fetchProfile();
    fetchBills();
    fetchNotifications();
  }, []);

  const handleClearNotifications = async (idsToClear?: string[]) => {
    try {
      if (idsToClear && idsToClear.length > 0) {
        await fetch("/api/notifications/me", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: idsToClear }),
        });
        setNotifications((prev) =>
          prev.filter((n) => !idsToClear.includes(n.id))
        );
      } else {
        await fetch("/api/notifications/me", { method: "DELETE" });
        setNotifications([]);
      }
      toast.success("ล้างการแจ้งเตือนเรียบร้อยแล้ว");
    } catch (err) {
      console.error("Failed to delete notifications", err);
      toast.error("ไม่สามารถล้างการแจ้งเตือนได้");
    }
  };

  return (
    <div className="flex min-h-screen bg-white text-black">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-200 sticky top-0 h-screen">
        <Sidebar role="user" />
      </aside>

      <main className="flex-1 p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 px-4 md:px-6">
          <div>
            <h1 className="text-3xl font-bold mb-1 text-[#0F3659]">
              สวัสดีคุณ {user?.firstName} {user?.lastName}
            </h1>
            <p className="text-gray-600">ยินดีต้อนรับสู่ระบบจัดการหอพัก</p>
          </div>
          <NotificationBell
            notifications={notifications}
            onClearNotifications={handleClearNotifications}
            onMarkRead={async (id) => {
              try {
                await fetch(`/api/notifications/${id}`, { method: "PATCH" });
                setNotifications((prev) =>
                  prev.map((n) => (n.id === id ? { ...n, read: true } : n))
                );
              } catch (err) {
                console.error("Failed to mark notification as read", err);
                toast.error("ไม่สามารถอัปเดตการแจ้งเตือนได้");
              }
            }}
          />
        </div>

        {/* Banner */}
        <div
          className="px-4 md:px-6 mb-8"
          onMouseEnter={() => setIsHover(true)}
          onMouseLeave={() => setIsHover(false)}
        >
          <div
            className="relative w-full rounded-2xl overflow-hidden shadow-sm
                       aspect-[21/9] sm:aspect-[16/6] md:aspect-[16/5] lg:aspect-[16/4]"
            onTouchStart={(e) => setTouchStartX(e.changedTouches[0].clientX)}
            onTouchEnd={(e) => {
              if (touchStartX === null) return;
              const dx = e.changedTouches[0].clientX - touchStartX;
              if (dx > 50) goPrev();
              if (dx < -50) goNext();
              setTouchStartX(null);
            }}
            aria-roledescription="carousel"
          >
            {bannerImages.map((src, index) => (
              <Image
                key={src + index}
                src={src}
                alt={`แบนเนอร์ ${index + 1}`}
                fill
                className={`absolute inset-0 object-cover transition-opacity duration-700 ${
                  currentIndex === index ? "opacity-100" : "opacity-0"
                }`}
                unoptimized={src.startsWith("http")}
                sizes="100vw"
                priority={currentIndex === index}
              />
            ))}

            {bannerImages.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="สไลด์ก่อนหน้า"
                  onClick={goPrev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 hover:bg-white
                             backdrop-blur px-3 py-2 shadow-md"
                >
                  ‹
                </button>
                <button
                  type="button"
                  aria-label="สไลด์ถัดไป"
                  onClick={goNext}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 hover:bg-white
                             backdrop-blur px-3 py-2 shadow-md"
                >
                  ›
                </button>
              </>
            )}

            {bannerImages.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
                {bannerImages.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    aria-label={`ไปสไลด์ที่ ${i + 1}`}
                    className={`h-2.5 w-2.5 rounded-full border transition ${
                      currentIndex === i
                        ? "bg-white border-white"
                        : "border-white/70 bg-white/40"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tenant Info */}
        <div className="mb-8 px-4 md:px-6">
          <h2 className="text-xl font-semibold mb-2">ข้อมูลผู้เช่า</h2>
          <div className="flex items-center gap-2 text-lg">
            <span>🏠</span>
            <span className="font-medium text-[#0F3659]">เลขห้องพัก:</span>
            <span>{user?.room?.roomNumber ?? "-"}</span>
          </div>
          <div className="flex items-center gap-2 mt-2 text-lg">
            <span>💲</span>
            <span className="font-medium text-[#0F3659]">
              ค่าเช่ารายเดือน: {user?.rentAmount?.toLocaleString()} บาท
            </span>
            <span className="text-sm text-gray-500">
              กำหนดชำระภายในวันที่ 5 ของทุกเดือน
            </span>
          </div>
        </div>

        {/* Payment History */}
        <div className="px-4 md:px-6">
          <h2 className="text-xl font-semibold mb-3">ประวัติการชำระเงิน</h2>
          <div className="overflow-x-auto border border-gray-200 rounded-md">
            <table className="min-w-full table-auto text-sm">
              <thead>
                <tr className="bg-gray-100 text-gray-600 text-left">
                  <th className="p-3">เดือน</th>
                  <th className="p-3">จำนวนเงิน</th>
                  <th className="p-3">สถานะ</th>
                  <th className="p-3">การดำเนินการ</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((bill) => (
                  <tr
                    key={bill.id}
                    className="border-t border-gray-200 hover:bg-gray-200 cursor-pointer transition-colors duration-200"
                  >
                    <td className="p-3">
                      {new Date(bill.billingMonth).toLocaleDateString("th-TH", {
                        year: "numeric",
                        month: "long",
                      })}
                    </td>
                    <td className="p-3">
                      {bill.totalAmount.toLocaleString()} บาท
                    </td>
                    <td className="p-3">
                      {bill.status === "PAID" ? (
                        <span className="inline-flex bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs items-center gap-1">
                          <i className="ri-checkbox-circle-fill text-green-600"></i>{" "}
                          ชำระแล้ว
                        </span>
                      ) : bill.status === "PENDING_APPROVAL" ? (
                        <span className="inline-flex bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs items-center gap-1">
                          <i className="ri-indeterminate-circle-fill text-yellow-600"></i>{" "}
                          รอการอนุมัติ
                        </span>
                      ) : (
                        <span className="inline-flex bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs items-center gap-1">
                          <i className="ri-close-circle-fill text-red-600"></i>{" "}
                          ยังไม่ชำระ
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <a
                        href={`/bills/${bill.id}`}
                        className="text-blue-600 underline text-sm hover:text-blue-800"
                      >
                        ดูรายละเอียด
                      </a>
                    </td>
                  </tr>
                ))}
                {bills.length === 0 && (
                  <tr>
                    <td className="p-3 text-gray-500 italic" colSpan={4}>
                      ไม่พบประวัติการชำระเงิน
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
