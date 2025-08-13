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
};

interface UserProfile {
  firstName: string;
  lastName: string;
  room: {
    roomNumber: string;
  };
  rentAmount: number;
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
  const [hasNewBill, setHasNewBill] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % bannerImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      const res = await fetch("/api/profile/me");
      if (!res.ok) return toast.error("โหลดข้อมูลผู้ใช้ไม่สำเร็จ");
      const data = await res.json();
      setUser({
        ...data.user,
        rentAmount: data.user?.room?.rentAmount ?? 3000,
      });
    };

    const fetchBills = async () => {
      const res = await fetch("/api/bills");
      if (!res.ok) return toast.error("โหลดข้อมูลบิลไม่สำเร็จ");
      const data = await res.json();
      setBills(data.bills);
    };

    const fetchNotifications = async () => {
      const res = await fetch("/api/notifications/me");
      if (!res.ok) return;

      const data = await res.json();
      const notiArray = Array.isArray(data) ? data : data.notifications;

      if (!Array.isArray(notiArray)) {
        console.error("Notification data is not an array:", data);
        return;
      }

      setNotifications(notiArray);

      const currentMonth = new Date().getMonth();
      const newBillNoti = notiArray.some((n: Notification) => {
        const createdMonth = new Date(n.createdAt).getMonth();
        return createdMonth === currentMonth;
      });

      setHasNewBill(newBillNoti);
    };

    fetchProfile();
    fetchBills();
    fetchNotifications();
  }, []);

  const handleClearNotifications = async () => {
    try {
      await fetch("/api/notifications/me", {
        method: "DELETE",
      });
      setNotifications([]);
      setHasNewBill(false);
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

      {/* Main content */}
      <main className="flex-1 max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">
              Hello , {user?.firstName} {user?.lastName}
            </h1>
            <p className="text-gray-600">Welcome to the dormitory website</p>
          </div>
          <NotificationBell
            notifications={notifications}
            hasNew={hasNewBill}
            onClearNotifications={handleClearNotifications}
          />
        </div>

       {/* Banner แบบ fade transition */}
          <div className="relative w-full h-52 rounded-xl overflow-hidden mb-8">
            {bannerImages.map((src, index) => (
              <Image
                key={index}
                src={src}
                alt={`Banner ${index + 1}`}
                fill
                style={{ objectFit: "cover" }}
                className={`absolute top-0 left-0 w-full h-full transition-opacity duration-1000 ${
                  currentIndex === index ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
                unoptimized={src.startsWith("http")}
                priority={currentIndex === index} // โหลดรูปปัจจุบันก่อน
              />
            ))}

            {/* Dots */}
            <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-3 rounded-full px-3 py-1 ">
              {bannerImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    currentIndex === index ? "bg-[#0F3659]" : "bg-gray-300"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>


        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Tenant Info</h2>
          <div className="flex items-center gap-2 text-lg">
            <span>🏠</span>
            <span className="font-medium text-[#0F3659]">Rental Agreement</span>
            <span>- Room {user?.room?.roomNumber ?? "-"}</span>
          </div>
          <div className="flex items-center gap-2 mt-2 text-lg">
            <span>💲</span>
            <span className="font-medium text-[#0F3659]">
              Rent Amount : {user?.rentAmount?.toLocaleString()} Bath
            </span>
            <span className="text-sm text-gray-500">Due on the 5th of each month</span>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-3">Payment History</h2>
          <div className="overflow-x-auto border border-gray-200 rounded-md">
            <table className="min-w-full table-auto text-sm">
              <thead>
                <tr className="bg-gray-100 text-gray-600  text-left">
                  <th className="p-3">Date</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
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
                    <td className="p-3">{bill.totalAmount.toLocaleString()} Bath</td>
                    <td className="p-3">
                      {bill.status === "PAID" ? (
                        <span className="inline-flex bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs items-center gap-1">
                        <i className="ri-checkbox-circle-fill text-green-600"></i> Paid
                      </span>
                      ) : bill.status === "PENDING_APPROVAL" ? (
                        <span className="inline-flex bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs items-center gap-1">
                        <i className="ri-indeterminate-circle-fill text-yellow-600"></i> Pending
                      </span>
                      ) : (
                        <span className="inline-flex bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs items-center gap-1">
                        <i className="ri-close-circle-fill text-red-600"></i> Unpaid
                      </span>
                      )}
                    </td>
                    <td className="p-3">
                      <a
                        href={`/bills/${bill.id}`}
                        className="text-blue-600 underline text-sm hover:text-blue-800"
                      >
                        See details
                      </a>
                    </td>
                  </tr>
                ))}
                {bills.length === 0 && (
                  <tr>
                    <td className="p-3 text-gray-500 italic" colSpan={4}>
                      No payment history found.
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