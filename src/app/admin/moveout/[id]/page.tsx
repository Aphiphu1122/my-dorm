"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Image from "next/image";
import Link from "next/link";
import Sidebar from "@/components/sidebar";

type MoveOutStatus = "PENDING_APPROVAL" | "APPROVED" | "REJECTED";

type Bill = {
  id: string;
  billingMonth: string;
  totalAmount: number;
  status: string;
};

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
    bills?: Bill[];
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
      toast.success(
        `อัปเดตสถานะเป็น ${
          status === "APPROVED" ? "อนุมัติแล้ว" : "ปฏิเสธแล้ว"
        }`
      );
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
    <div className="flex min-h-screen bg-white text-black">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-200 sticky top-0 h-screen">
        <Sidebar role="admin" />
      </aside>

      <div className="flex-1 max-w-5xl mx-auto p-8">
        <div>
          <h1 className="text-3xl font-bold text-[#0F3659]">
            Details of move out request
          </h1>
          <p className="text-gray-600 mt-1">
            Manage all tenant move-out requests in the system.
          </p>
        </div>

        <div className="bg-white mt-5">
          {/* Tenant info */}
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-blue-950">Tenant information</h2>
            <div className="bg-white shadow-md rounded-lg p-2">
              <div className="divide-y divide-gray-200">
                <div className="grid grid-cols-2 py-1">
                  <strong className="p-2 text-gray-700">Name</strong>
                  <span className="text-right mr-5">
                    {request.user.firstName} {request.user.lastName}
                  </span>
                </div>
                <div className="grid grid-cols-2 py-1">
                  <strong className="p-2 text-gray-700">Email</strong>
                  <span className="text-right mr-5">{request.user.email}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Room info */}
          <div className="space-y-2 mt-5">
            <h2 className="text-xl font-semibold text-blue-950">Room information</h2>
            <div className="bg-white shadow-md rounded-lg p-2">
              <div className="grid grid-cols-2 py-1">
                <strong className="p-2 text-gray-700">Room number</strong>
                <span className="text-right mr-5">{request.room.roomNumber}</span>
              </div>
            </div>
          </div>

          {/* Move out info */}
          <div className="space-y-2 mt-5">
            <h2 className="text-xl font-semibold text-blue-950">Move out information</h2>
            <div className="bg-white shadow-md rounded-lg p-2">
              <div className="divide-y divide-gray-200">
                <div className="grid grid-cols-2 py-1">
                  <strong className="p-2 text-gray-700">Request date</strong>
                  <span className="text-right mr-5">
                    {new Date(request.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="grid grid-cols-2 py-1">
                  <strong className="p-2 text-gray-700">Moving date</strong>
                  <span className="text-right mr-5">
                    {new Date(request.moveOutDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="grid grid-cols-2 py-1">
                  <strong className="p-2 text-gray-700">Reason</strong>
                  <span className="text-right mr-5">{request.reason}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Attached image */}
          {request.imageUrl && (
            <div className="mt-5">
              <p>
                <strong>รูปประกอบ:</strong>
              </p>
              <Image
                src={request.imageUrl}
                alt="รูปภาพแนบ"
                width={400}
                height={300}
                className="rounded-lg border"
              />
            </div>
          )}

          {/* ✅ Unpaid bills */}
          {request.user.bills && request.user.bills.length > 0 && (
            <div className="space-y-2 mt-5">
              <h2 className="text-xl font-semibold text-red-600">Unpaid Bills</h2>
              <div className="bg-white shadow-md rounded-lg p-2">
                <div className="divide-y divide-gray-200">
                  {request.user.bills.map((bill) => (
                    <div
                      key={bill.id}
                      className="grid grid-cols-4 items-center py-2"
                    >
                      <span className="font-medium text-gray-700">
                        {bill.billingMonth}
                      </span>
                      <span className="text-gray-600 text-right">
                        {bill.totalAmount.toLocaleString()} ฿
                      </span>
                      <span className="text-right text-red-600 font-semibold">
                        {bill.status}
                      </span>
                      <Link
                        href={`/admin/bills/${bill.id}`}
                        className="text-blue-600 hover:underline text-right"
                      >
                        View
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Status */}
          <div className="space-y-2 mt-5">
            <h2 className="text-xl font-semibold text-blue-950">Status</h2>
            <div className="bg-white shadow-md rounded-lg p-2">
              <div className="grid grid-cols-2 py-1 items-center">
                {/* Status Badge */}
                <div className="flex items-center justify-start p-2">
                  {request.status === "PENDING_APPROVAL" && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 font-semibold text-sm">
                      <i className="ri-indeterminate-circle-fill"></i> Pending
                    </span>
                  )}
                  {request.status === "APPROVED" && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 font-semibold text-sm">
                      <i className="ri-checkbox-circle-fill"></i> Approved
                    </span>
                  )}
                  {request.status === "REJECTED" && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 text-red-700 font-semibold text-sm">
                      <i className="ri-close-circle-fill"></i> Rejected
                    </span>
                  )}
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-end gap-4 p-2">
                  {request.status === "PENDING_APPROVAL" && (
                    <>
                      <button
                        onClick={() => handleConfirm("APPROVED")}
                        disabled={isProcessing}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleConfirm("REJECTED")}
                        disabled={isProcessing}
                        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition disabled:opacity-50"
                      >
                        Refuse
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Link
            href="/admin/moveout"
            className="inline-block px-4 py-2 mt-5 bg-gray-400 text-white rounded hover:bg-gray-500 transition duration-200 transform hover:scale-105"
          >
            Back to all moveout
          </Link>
        </div>

        {/* Confirm Modal */}
        {showConfirm && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md space-y-4">
              <h2 className="text-xl font-bold text-center text-gray-800">
                ยืนยันการดำเนินการ
              </h2>
              <p className="text-center text-gray-600">
                คุณแน่ใจหรือไม่ว่าต้องการ{" "}
                <span
                  className={
                    confirmAction === "APPROVED"
                      ? "text-green-600 font-semibold"
                      : "text-red-600 font-semibold"
                  }
                >
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
                  onClick={() =>
                    confirmAction && handleUpdateStatus(confirmAction)
                  }
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
    </div>
  );
}
