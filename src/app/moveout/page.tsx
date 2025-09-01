"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import "remixicon/fonts/remixicon.css";
import Sidebar from "@/components/sidebar";

type Room = {
  id: string;
  roomNumber: string;
};

type UserInfo = {
  firstName: string;
  lastName: string;
  email: string;
  roomStartDate: string;
};

export default function MoveOutRequestPage() {
  const router = useRouter();

  const [room, setRoom] = useState<Room | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [reason, setReason] = useState("");
  const [moveOutDate, setMoveOutDate] = useState("");
  const [password, setPassword] = useState("");
  const [agreePolicy, setAgreePolicy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const today = new Date();
  const minMoveOutDate = new Date(today);
  minMoveOutDate.setDate(today.getDate() + 30);
  const minDateStr = minMoveOutDate.toISOString().split("T")[0];

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const res = await fetch("/api/profile/me", { credentials: "include" });
        const data = await res.json();

        if (!data?.roomId || !data?.roomNumber) {
          toast.error("ไม่พบข้อมูลห้องของคุณ");
          return;
        }

        setRoom({
          id: data.roomId,
          roomNumber: data.roomNumber,
        });

        setUserInfo({
          firstName: data.firstName || "-",
          lastName: data.lastName || "-",
          email: data.email || "-",
          roomStartDate:
            data.roomStartDate || data.joinDate || new Date().toISOString(),
        });
      } catch (err) {
        console.error(err);
        toast.error("ไม่สามารถโหลดข้อมูลห้องได้");
      } finally {
        setInitialLoading(false);
      }
    };

    fetchRoom();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason.trim()) return toast.error("กรุณาระบุเหตุผลในการย้ายออก");
    if (!moveOutDate) return toast.error("กรุณาเลือกวันที่ย้ายออก");
    if (!password.trim()) return toast.error("กรุณากรอกรหัสผ่านเพื่อยืนยันตัวตน");
    if (!room?.id) return toast.error("ไม่พบข้อมูลห้องพัก");
    if (!agreePolicy)
      return toast.error("กรุณายอมรับเงื่อนไขการยื่นคำร้องอย่างน้อย 30 วัน");

    // ✅ ตรวจสอบว่าเป็นเดือนถัดไป
    const selectedDate = new Date(moveOutDate);
    const isSameMonth =
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getFullYear() === today.getFullYear();

    if (isSameMonth) {
      return toast.error("ไม่สามารถยื่นคำร้องในเดือนปัจจุบันได้");
    }

    setLoading(true);
    try {
      const res = await fetch("/api/moveout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: room.id,
          reason,
          moveOutDate,
          password,
          acceptTerms: agreePolicy, // ✅ ส่งค่าไปให้ API
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("ส่งคำร้องขอย้ายออกเรียบร้อยแล้ว");
        router.push("/home");
      } else {
        if (data?.error?.password) toast.error(data.error.password[0]);
        else if (data?.error?.reason) toast.error(data.error.reason[0]);
        else if (typeof data?.error === "string") toast.error(data.error);
        else toast.error("เกิดข้อผิดพลาดไม่ทราบสาเหตุ");
      }
    } catch (err) {
      console.error(err);
      toast.error("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-200 sticky top-0 h-screen">
        <Sidebar role="user" />
      </aside>

      <main className="flex-1 max-w-5xl mx-auto p-6">
        {initialLoading ? (
          <div className="text-center py-24 text-gray-400 text-lg font-medium animate-pulse">
            กำลังโหลดข้อมูล...
          </div>
        ) : (
          <>
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold mb-1 text-[#0F3659]">
                Move-out Request
              </h1>
              <p className="text-gray-500 mb-6">Manage your move here</p>
            </div>

            {/* Personal Info Panel */}
            {userInfo && room && (
              <div className="bg-gradient-to-r from-blue-50 to-white p-6 rounded-2xl shadow-xl mb-10 border border-blue-100">
                <h2 className="text-lg font-bold text-black mb-4 flex items-center gap-2">
                  <i className="ri-user-line text-2xl text-blue-700"></i>{" "}
                  Personal Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-xl shadow hover:shadow-lg transition">
                    <p className="text-gray-500 text-sm">Name</p>
                    <p className="font-semibold text-gray-900">
                      {userInfo.firstName} {userInfo.lastName}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-xl shadow hover:shadow-lg transition">
                    <p className="text-gray-500 text-sm">Email</p>
                    <p className="font-semibold text-gray-900">
                      {userInfo.email}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-xl shadow hover:shadow-lg transition">
                    <p className="text-gray-500 text-sm">Room Number</p>
                    <p className="font-semibold text-gray-900">
                      {room.roomNumber}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-xl shadow hover:shadow-lg transition">
                    <p className="text-gray-500 text-sm">Check-in Date</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(userInfo.roomStartDate).toLocaleDateString(
                        "th-TH",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Move-out Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Reason */}
              <div className="bg-gradient-to-r from-blue-50 to-white  mb-10 border border-blue-100 rounded-2xl p-6 shadow-lg hover:shadow-xl transition">
                <label className=" text-lg font-semibold text-black mb-2 flex items-center gap-2">
                  <i className="ri-file-text-line text-2xl text-blue-500"></i>{" "}
                  Reasons for moving out
                </label>
                <textarea
                  className="w-full border border-gray-200 rounded-xl p-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  placeholder="Please state your reason."
                />
              </div>

              {/* Date & Password */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition">
                  <label className=" font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <i className="ri-calendar-line text-green-500"></i> Move-out
                    Date
                  </label>
                  <input
                    type="date"
                    className="w-full border border-gray-200 rounded-xl p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    value={moveOutDate}
                    onChange={(e) => setMoveOutDate(e.target.value)}
                    min={minDateStr}
                  />
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition">
                  <label className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <i className="ri-lock-line text-red-500"></i> Password
                  </label>
                  <input
                    type="password"
                    className="w-full border border-gray-200 rounded-xl p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                  />
                </div>
              </div>

              {/* Policy Agreement */}
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={agreePolicy}
                  onChange={(e) => setAgreePolicy(e.target.checked)}
                  className="mt-1 w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-400"
                />
                <p className="text-gray-700 text-sm">
                  I understand and accept that{" "}
                  <span className="font-semibold underline">
                    applications must be submitted at least 30 days prior to
                    move-out
                  </span>{" "}
                  to request a refund of the security deposit.
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-2xl font-bold text-white transition-all ${
                  loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 shadow-lg hover:shadow-xl"
                }`}
              >
                {loading ? "Submitting..." : "Submit Move-out Request"}
              </button>
            </form>
          </>
        )}
      </main>
    </div>
  );
}
