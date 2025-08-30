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
          roomStartDate: data.roomStartDate || data.joinDate || new Date().toISOString(),
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
    if (!agreePolicy) return toast.error("กรุณายอมรับเงื่อนไขการคืนเงินประกัน");

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
          <div className="text-center py-20 text-gray-500">กำลังโหลดข้อมูล...</div>
        ) : (
          <>
            <div>
              <h1 className="text-3xl font-bold mb-1 text-[#0F3659]">Move-out Request</h1>
              <p className="text-gray-500 mb-6">Manage your move here</p>
            </div>

            {userInfo && room && (
              <div className="mb-6 text-sm text-gray-700 ">
                <h2 className="text-lg font-semibold text-[#0F3659] mb-1">Personal Information</h2>
                <section className="bg-white shadow-md rounded-lg p-2">
                  <div className="divide-y divide-gray-200">
                    <p className="flex justify-between py-3 p-2 text-gray-700"><strong>Name</strong> {userInfo.firstName} {userInfo.lastName}</p>
                    <p className="flex justify-between py-3 p-2 text-gray-700"><strong>Email</strong> {userInfo.email}</p>
                    <p className="flex justify-between py-3 p-2 text-gray-700"><strong>Room number</strong> {room.roomNumber}</p>
                    <p className="flex justify-between py-3 p-2 text-gray-700"><strong>Check-in date</strong>{" "}
                      {new Date(userInfo.roomStartDate).toLocaleDateString("th-TH", {
                        year: "numeric", month: "long", day: "numeric",
                      })}
                    </p>
                  </div>
                </section>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-medium">Reasons for moving out</label>
                <textarea
                  className="w-full border p-2 rounded"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  placeholder="Please state your reason."
                />
              </div>

              <div>
                <label className="block font-medium">Date you wish to move out</label>
                <input
                  type="date"
                  className="w-full border p-2 rounded"
                  value={moveOutDate}
                  onChange={(e) => setMoveOutDate(e.target.value)}
                  min={minDateStr}
                />
              </div>

              <div>
                <label className="block font-medium">Password for verification</label>
                <input
                  type="password"
                  className="w-full border p-2 rounded"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                />
              </div>

              <div className="flex items-start space-x-2">
                <input
                  type="checkbox"
                  checked={agreePolicy}
                  onChange={(e) => setAgreePolicy(e.target.checked)}
                  className="mt-1"
                />
                <span className="text-sm text-gray-700">
                  I understand and accept that{" "}
                  <span className="font-semibold underline">
                    Applications must be submitted at least 30 days prior to the move-out date.
                  </span>{" "}
                  To request a refund of the security deposit according to the dormitory regulations.
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-2 px-4 text-white rounded ${loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"}`}
              >
                {loading ? "กำลังส่ง..." : "Submit"}
              </button>
            </form>
          </>
        )}
      </main>
    </div>
  );
}
