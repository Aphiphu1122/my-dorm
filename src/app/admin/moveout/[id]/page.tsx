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
  const [isProcessing, setIsProcessing] = useState(false);

  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState<MoveOutStatus | null>(null);

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

  const handleConfirm = (status: MoveOutStatus) => {
    setConfirmAction(status);
    setShowConfirm(true);
  };

  const handleUpdateStatus = async (status: MoveOutStatus) => {
    setIsProcessing(true);

    try {
      const res = await fetch(`/api/admin/moveout/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) throw new Error("ไม่สามารถอัปเดตสถานะได้");

      setRequest((prev) => (prev ? { ...prev, status } : prev));
      toast.success(`อัปเดตสถานะเป็น ${status === "APPROVED" ? "อนุมัติแล้ว" : "ปฏิเสธแล้ว"}`);
      router.push("/admin/moveout");
    } catch (err) {
      console.error(err);
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setIsProcessing(false);
      setShowConfirm(false);
    }
  };

  if (loading) {
    return <p className="text-center mt-10 text-gray-600">กำลังโหลดข้อมูล...</p>;
  }

  if (!request) {
    return <p className="text-center mt-10 text-red-600">ไม่พบข้อมูลคำร้อง</p>;
  }

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
              onClick={() => handleConfirm("APPROVED")}
              disabled={isProcessing}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition disabled:opacity-50"
            >
              ✅ อนุมัติ
            </button>
            <button
              onClick={() => handleConfirm("REJECTED")}
              disabled={isProcessing}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition disabled:opacity-50"
            >
              ❌ ปฏิเสธ
            </button>
          </div>
        )}

        <Link
          href="/admin/moveout"
          className="mt-6 inline-block text-blue-600 hover:underline"
        >
          ← ย้อนกลับไปหน้ารายการคำร้อง
        </Link>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md space-y-4">
            <h2 className="text-xl font-bold text-center text-gray-800">ยืนยันการดำเนินการ</h2>
            <p className="text-center text-gray-600">
              คุณแน่ใจหรือไม่ว่าต้องการ{" "}
              <span className={confirmAction === "APPROVED" ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                {confirmAction === "APPROVED" ? "อนุมัติ" : "ปฏิเสธ"}
              </span>{" "}
              คำร้องนี้?
            </p>
            <div className="flex justify-center gap-4 pt-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => confirmAction && handleUpdateStatus(confirmAction)}
                className={`px-4 py-2 rounded text-white flex items-center gap-2 ${
                  confirmAction === "APPROVED"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
                disabled={isProcessing}
              >
                {isProcessing && (
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                )}
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
