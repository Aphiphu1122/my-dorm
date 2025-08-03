"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Request = {
  id: string;
  description: string;
  status: string;
  createdAt: string;
  room: { roomNumber: string };
};

export default function MaintenanceListPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/admin/maintenance");
      const data = await res.json();
      console.log("✅ ได้ข้อมูล:", data);
      setRequests(data.maintenanceRequests);
    } catch (err) {
      console.error("❌ โหลดล้มเหลว", err);
    } finally {
      setLoading(false);
    }
  };
  fetchRequests();
}, []);

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case "PENDING":
        return "⏳";
      case "IN_PROGRESS":
        return "🟡";
      case "COMPLETED":
        return "🟢";
      case "CANCLE":
        return "🔴";
      default:
        return "";
    }
  };

  if (loading) return <p className="p-4">กำลังโหลดข้อมูล...</p>;

  if (!Array.isArray(requests)) return <p>ไม่มีข้อมูลรายการซ่อม</p>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">รายการแจ้งซ่อม</h1>
      <table className="w-full table-auto border-collapse border rounded">
        <thead className="bg-gray-900">
          <tr>
            <th className="p-2 text-left">Submission Date</th>
            <th className="p-2 text-left">Request ID</th>
            <th className="p-2 text-left">Room</th>
            <th className="p-2 text-left">Description</th>
            <th className="p-2 text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((req) => (
            <tr key={req.id} className="border-t hover:bg-gray-50">
              <td className="p-2">{new Date(req.createdAt).toLocaleDateString()}</td>
              <td className="p-2">
                <Link href={`/admin/maintenance/${req.id}`} className="text-blue-600 underline">
                  #{req.id.slice(0, 6)}
                </Link>
              </td>
              <td className="p-2">{req.room.roomNumber}</td>
              <td className="p-2">{req.description}</td>
              <td className="p-2">{getStatusEmoji(req.status)} {req.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
