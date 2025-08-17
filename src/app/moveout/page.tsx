"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import "remixicon/fonts/remixicon.css";

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

  const today = new Date().toISOString().split("T")[0];

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

  if (initialLoading) {
    return <div className="text-center py-20 text-gray-500">กำลังโหลดข้อมูล...</div>;
  }

  return (
    <div className="max-w-xl mx-auto p-6 bg-white shadow-md rounded mt-10">

      <button
        onClick={() => router.back()}
        className="flex items-center text-blue-600 hover:underline mb-4"
      >
        <i className="ri-arrow-left-line mr-2" /> ย้อนกลับ
      </button>
      <h1 className="text-2xl font-bold mb-6 text-center">แจ้งย้ายออก</h1>

      {userInfo && room && (
        <div className="mb-6 text-sm text-gray-700 bg-gray-100 p-4 rounded shadow-sm">
          <p>👤 <strong>ชื่อผู้เช่า:</strong> {userInfo.firstName} {userInfo.lastName}</p>
          <p>📧 <strong>อีเมล:</strong> {userInfo.email}</p>
          <p>🏠 <strong>ห้องพัก:</strong> {room.roomNumber}</p>
          <p>📅 <strong>วันที่เข้าพัก:</strong>{" "}
            {new Date(userInfo.roomStartDate).toLocaleDateString("th-TH", {
              year: "numeric", month: "long", day: "numeric",
            })}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium">เหตุผลในการย้ายออก</label>
          <textarea
            className="w-full border p-2 rounded"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="กรุณาระบุเหตุผลของคุณที่นี่"
          />
        </div>

        <div>
          <label className="block font-medium">วันที่ต้องการย้ายออก</label>
          <input
            type="date"
            className="w-full border p-2 rounded"
            value={moveOutDate}
            onChange={(e) => setMoveOutDate(e.target.value)}
            min={today}
          />
        </div>

        <div>
          <label className="block font-medium">รหัสผ่านเพื่อยืนยันตัวตน</label>
          <input
            type="password"
            className="w-full border p-2 rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="กรอกรหัสผ่านของคุณ"
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
            ข้าพเจ้าเข้าใจและยอมรับว่า{" "}
            <span className="font-semibold underline">
              ต้องยื่นคำร้องล่วงหน้าอย่างน้อย 30 วันก่อนวันย้ายออก
            </span>{" "}
            เพื่อขอรับเงินประกันคืน ตามระเบียบของหอพัก
          </span>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 px-4 text-white rounded ${loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"}`}
        >
          {loading ? "กำลังส่ง..." : "ส่งคำร้อง"}
        </button>
      </form>
    </div>
  );
}
