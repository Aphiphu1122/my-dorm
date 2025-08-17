"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Image from "next/image";
import Link from "next/link";

type MoveOutStatus = "PENDING_APPROVAL" | "APPROVED" | "REJECTED";

type MoveOutRequest = {
  id: string;
  reason: string;
  moveOutDate: string;
  createdAt: string;
  status: MoveOutStatus;
  note?: string;
  imageUrl?: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  room: {
    roomNumber: string;
  };
};

export default function AdminMoveOutDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [request, setRequest] = useState<MoveOutRequest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await fetch(`/api/admin/moveout/${id}`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("ไม่พบคำร้อง");
        const data = await res.json();
        setRequest(data);
      } catch (err) {
        console.error(err);
        toast.error("ไม่สามารถโหลดข้อมูลได้");
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  const handleUpdateStatus = async (status: MoveOutStatus) => {
    try {
      const res = await fetch(`/api/admin/moveout/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) throw new Error("ไม่สามารถอัปเดตสถานะได้");

      setRequest((prev) => prev ? { ...prev, status } : prev);
      toast.success(`อัปเดตสถานะสำเร็จ`);
      router.push("/admin/moveout");
    } catch (err) {
    console.error(err);
      toast.error("เกิดข้อผิดพลาด");
    }
  };

  if (loading) return <p className="p-6">กำลังโหลด...</p>;
  if (!request) return <p className="p-6 text-red-500">ไม่พบข้อมูลคำร้อง</p>;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-blue-900">รายละเอียดคำร้องย้ายออก</h1>

      <div className="bg-white shadow p-6 rounded-lg space-y-3 border">
        <p><strong>ชื่อผู้เช่า:</strong> {request.user.firstName} {request.user.lastName}</p>
        <p><strong>อีเมล:</strong> {request.user.email}</p>
        <p><strong>ห้อง:</strong> {request.room.roomNumber}</p>
        <p><strong>วันที่ยื่นคำร้อง:</strong> {new Date(request.createdAt).toLocaleDateString()}</p>
        <p><strong>วันที่ต้องการย้ายออก:</strong> {new Date(request.moveOutDate).toLocaleDateString()}</p>
        <p><strong>เหตุผล:</strong> {request.reason}</p>
        {request.note && <p><strong>หมายเหตุ:</strong> {request.note}</p>}

        {request.imageUrl && (
          <div>
            <p><strong>รูปประกอบ:</strong></p>
            <Image
              src={request.imageUrl}
              alt="รูปภาพแนบ"
              width={400}
              height={300}
              className="rounded-lg border"
            />
          </div>
        )}

        <div className="mt-4">
          <p className="text-lg">
            <strong>สถานะ:</strong>{" "}
            {request.status === "PENDING_APPROVAL" && (
              <span className="text-yellow-600 font-semibold">⏳ รอดำเนินการ</span>
            )}
            {request.status === "APPROVED" && (
              <span className="text-green-600 font-semibold">✅ อนุมัติแล้ว</span>
            )}
            {request.status === "REJECTED" && (
              <span className="text-red-600 font-semibold">❌ ปฏิเสธแล้ว</span>
            )}
          </p>
        </div>

        {request.status === "PENDING_APPROVAL" && (
          <div className="mt-4 flex gap-4">
            <button
              onClick={() => handleUpdateStatus("APPROVED")}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
            >
              ✅ อนุมัติ
            </button>
            <button
              onClick={() => handleUpdateStatus("REJECTED")}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
            >
              ❌ ปฏิเสธ
            </button>
          </div>
        )}

        <Link href="/admin/moveout" className="text-blue-600 mt-4 block hover:underline">
          ← กลับไปยังรายการคำร้อง
        </Link>
      </div>
    </div>
  );
}
