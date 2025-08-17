"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import Sidebar from "@/components/sidebar";

type MoveOutStatus = "PENDING_APPROVAL" | "APPROVED" | "REJECTED";

type MoveOutRequest = {
  id: string;
  reason: string;
  moveOutDate: string;
  createdAt: string;
  status: MoveOutStatus;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  room: {
    roomNumber: string;
  };
};

export default function AdminMoveOutListPage() {
  const [requests, setRequests] = useState<MoveOutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/admin/moveout", {
        credentials: "include",
      });
      const data = await res.json();
      setRequests(data);
    } catch (error) {
      console.error("โหลดข้อมูลล้มเหลว", error);
      toast.error("ไม่สามารถโหลดข้อมูลได้");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: "APPROVED" | "REJECTED") => {
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/admin/moveout/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: action }),
      });

      if (!res.ok) throw new Error("อัปเดตไม่สำเร็จ");

      toast.success(
        `อัปเดตคำร้องเป็น "${action === "APPROVED" ? "อนุมัติ" : "ปฏิเสธ"}" แล้ว`
      );
      fetchRequests(); // รีเฟรชข้อมูล
    } catch (err) {
      console.error(err);
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setActionLoadingId(null);
    }
  };

  if (loading) return <p className="p-4">กำลังโหลด...</p>;

  return (
    <div className="flex min-h-screen bg-white text-black">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-200 sticky top-0 h-screen">
        <Sidebar role="admin" />
      </aside>

      {/* Main */}
      <main className="flex-1 p-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#0F3659]">คำร้องขอย้ายออก</h1>
            <p className="text-gray-600 mt-1">
              จัดการคำร้องขอย้ายออกจากผู้เช่าทั้งหมดในระบบ
            </p>
          </div>
          <div className="text-sm text-gray-600">
            ทั้งหมด:{" "}
            <span className="font-semibold">
              {requests.length.toLocaleString()}
            </span>
          </div>
        </div>

        {requests.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-500">
            ยังไม่มีคำร้องขอย้ายออก
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
            <table className="min-w-full table-auto text-sm text-left">
              <thead>
                <tr className="bg-gray-100 text-gray-700">
                  <th className="px-4 py-3">ชื่อผู้ใช้</th>
                  <th className="px-4 py-3">ห้อง</th>
                  <th className="px-4 py-3">เหตุผล</th>
                  <th className="px-4 py-3">วันที่ย้าย</th>
                  <th className="px-4 py-3">สถานะ</th>
                  <th className="px-4 py-3">การจัดการ</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {req.user.firstName} {req.user.lastName}
                    </td>
                    <td className="px-4 py-3">{req.room.roomNumber}</td>
                    <td className="px-4 py-3">{req.reason}</td>
                    <td className="px-4 py-3">
                      {new Date(req.moveOutDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {req.status === "PENDING_APPROVAL" && (
                        <span className="text-yellow-600">⏳ รอดำเนินการ</span>
                      )}
                      {req.status === "APPROVED" && (
                        <span className="text-green-600">✅ อนุมัติแล้ว</span>
                      )}
                      {req.status === "REJECTED" && (
                        <span className="text-red-600">❌ ถูกปฏิเสธ</span>
                      )}
                    </td>
                    <td className="px-4 py-3 space-x-2">
                      <Link
                        href={`/admin/moveout/${req.id}`}
                        className="text-blue-600 underline"
                      >
                        ดูรายละเอียด
                      </Link>
                      {req.status === "PENDING_APPROVAL" && (
                        <>
                          <button
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
                            onClick={() => handleAction(req.id, "APPROVED")}
                            disabled={actionLoadingId === req.id}
                          >
                            {actionLoadingId === req.id
                              ? "กำลังอนุมัติ..."
                              : "อนุมัติ"}
                          </button>
                          <button
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                            onClick={() => handleAction(req.id, "REJECTED")}
                            disabled={actionLoadingId === req.id}
                          >
                            {actionLoadingId === req.id
                              ? "กำลังปฏิเสธ..."
                              : "ปฏิเสธ"}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
