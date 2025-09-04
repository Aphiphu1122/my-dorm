"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Image from "next/image";
import Sidebar from "@/components/sidebar";
import Link from "next/link";

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
        const res = await fetch(`/api/admin/moveout/${id}`, { credentials: "include" });
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

  if (loading) return <p className="text-center mt-10 text-gray-600">กำลังโหลดข้อมูล...</p>;
  if (!request) return <p className="text-center mt-10 text-red-600">ไม่พบข้อมูลคำร้อง</p>;

  const statusColors = {
    PENDING_APPROVAL: "bg-yellow-100 text-yellow-800",
    APPROVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
  };

  return (
    <div className="flex min-h-screen bg-white">
      <aside className="w-64 border-r border-gray-200 sticky top-0 h-screen">
        <Sidebar role="admin" />
      </aside>

      <main className="flex-1 p-8 max-w-6xl mx-auto">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-[#0F3659]">Move Out Request Detail</h1>
          <p className="text-gray-600">Review and manage tenants move-out requests.</p>
        </div>

        {/* Grid layout for all cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Tenant Card */}
          <div className="bg-white shadow rounded-lg p-6 space-y-3">
            <h2 className="text-xl font-semibold text-blue-950">Tenant Info</h2>
            <p><strong>Name:</strong> {request.user.firstName} {request.user.lastName}</p>
            <p><strong>Email:</strong> {request.user.email}</p>
          </div>

          {/* Room Card */}
          <div className="bg-white shadow rounded-lg p-6 space-y-3">
            <h2 className="text-xl font-semibold text-blue-950">Room Info</h2>
            <p><strong>Room Number:</strong> {request.room.roomNumber}</p>
          </div>

          {/* Move Out Info */}
          <div className="bg-white shadow rounded-lg p-6 space-y-3 md:col-span-2">
            <h2 className="text-xl font-semibold text-blue-950">Move Out Info</h2>
            <p><strong>Request Date:</strong> {new Date(request.createdAt).toLocaleDateString()}</p>
            <p><strong>Moving Date:</strong> {new Date(request.moveOutDate).toLocaleDateString()}</p>
            <p><strong>Reason:</strong> {request.reason}</p>
          </div>

          {/* Attached Image */}
          {request.imageUrl && (
            <div className="bg-white shadow rounded-lg p-6 flex justify-center">
              <Image
                src={request.imageUrl}
                alt="Attached"
                width={500}
                height={350}
                className="rounded-lg border"
              />
            </div>
          )}

          {/* Bills Card */}
          {request.user.bills && request.user.bills.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6 md:col-span-2">
              <h2 className="text-xl font-semibold text-red-600 mb-3">Unpaid Bills</h2>
              <div className="divide-y divide-gray-200">
                {request.user.bills.map((bill) => (
                  <div key={bill.id} className="flex justify-between items-center py-2 hover:bg-gray-50 px-2 rounded transition cursor-pointer">
                    <span>{bill.billingMonth}</span>
                    <span>{bill.totalAmount.toLocaleString()} ฿</span>
                    <span className={`font-semibold ${bill.status === 'UNPAID' ? 'text-red-600' : 'text-green-600'}`}>
                      {bill.status}
                    </span>
                    <Link href={`/admin/bills/${bill.id}`} className="text-blue-600 hover:underline">
                      View
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Status & Action */}
        <div className="bg-white shadow rounded-lg p-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <span className={`px-4 py-1 rounded-full font-semibold ${statusColors[request.status]}`}>
            {request.status.replace("_", " ")}
          </span>
          {request.status === "PENDING_APPROVAL" && (
            <div className="flex gap-3">
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
            </div>
          )}
        </div>

        {/* ปุ่ม Back ย้ายมาด้านล่าง */}
        <div className="flex justify-start mt-6">
          <Link
            href="/admin/moveout"
            className="inline-block px-8 py-2 bg-gray-300 text-white rounded hover:bg-gray-400 transition"
          >
            Back
          </Link>
        </div>

        {/* Confirm Modal */}
        {showConfirm && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md space-y-4">
              <h2 className="text-xl font-bold text-center text-gray-800">Confirm Action</h2>
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
                  Cancel
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
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                    </svg>
                  )}
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
