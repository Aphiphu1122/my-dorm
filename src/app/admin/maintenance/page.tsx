"use client";
 
import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import Sidebar from "@/components/sidebar";
 
type RequestStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCEL";
 
type Request = {
  id: string;
  description: string;
  status: RequestStatus;
  createdAt: string;
  room: { roomNumber: string };
};
 
export default function MaintenanceListPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
 
  useEffect(() => {
    fetchRequests();
  }, []);
 
  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/admin/maintenance");
      if (!res.ok) {
        throw new Error("โหลดข้อมูลรายการแจ้งซ่อมไม่สำเร็จ");
      }
      const data = await res.json();
      setRequests(data.maintenanceRequests);
    } catch (err: unknown) {
      toast.error(
        err instanceof Error
          ? err.message
          : "เกิดข้อผิดพลาดในการโหลดรายการแจ้งซ่อม"
      );
    } finally {
      setLoading(false);
    }
  };
 
  const getStatusLabel = (status: RequestStatus) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-yellow-700 bg-yellow-100 font-semibold text-sm">
            ⏳ Pending
          </span>
        );
      case "IN_PROGRESS":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-blue-700 bg-blue-100 font-semibold text-sm">
            🟡 In Progress
          </span>
        );
      case "COMPLETED":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-green-700 bg-green-100 font-semibold text-sm">
            🟢 Completed
          </span>
        );
      case "CANCEL":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-red-700 bg-red-100 font-semibold text-sm">
            🔴 Cancelled
          </span>
        );
      default:
        return null;
    }
  };
 
return (
  <div className="flex min-h-screen bg-white">
    <aside className="w-64 border-r border-gray-200 sticky top-0 h-screen">
      <Sidebar role="admin" />
    </aside>
 
    {/* ขวา*/}
    <div className="flex-1 p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 px-4 md:px-6">
        <div>
          <h1 className="text-3xl font-bold text-[#0F3659]">Maintenance Requests</h1>
          <h2 className="text-gray-400 mt-2">Manage your maintenance requests</h2>
        </div>
      </div>
 
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 border-solid border-b-transparent"></div>
        </div>
      ) : requests.length === 0 ? (
        <p className="text-center text-gray-500 text-lg mt-10 px-6">
          No maintenance requests found.
        </p>
      ) : (
        // ตารางเต็มความกว้างหน้าจอ (ยังคง overflow-x-auto เผื่อจอเล็ก)
        <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200 bg-white mx-4 md:mx-6">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-100">
              <tr>
                {["Submission Date", "Request ID", "Room", "Description", "Status"].map((header) => (
                  <th
                    key={header}
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
 
            <tbody className="divide-y divide-gray-100">
              {requests.map((req) => (
                <tr
                  key={req.id}
                  className="hover:bg-gray-200 cursor-pointer transition-colors duration-150 ease-in-out"
                  onClick={() => {
                    window.location.href = `/admin/maintenance/${req.id}`;
                  }}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      window.location.href = `/admin/maintenance/${req.id}`;
                    }
                  }}
                  role="link"
                  aria-label={`View details for maintenance request ${req.id} in room ${req.room.roomNumber}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                    {new Date(req.createdAt).toLocaleDateString("th-TH")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                    <Link
                      href={`/admin/maintenance/${req.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-blue-600 underline"
                    >
                      #{req.id.slice(0, 6)}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                    {req.room.roomNumber}
                  </td>
                  <td
                    className="px-6 py-4 whitespace-nowrap text-gray-700 max-w-xs truncate"
                    title={req.description}
                  >
                    {req.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusLabel(req.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  </div>
);
}