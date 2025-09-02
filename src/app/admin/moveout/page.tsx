"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [requests, setRequests] = useState<MoveOutRequest[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading)
    return (
      <div className="flex min-h-screen">
        <aside className="w-64 border-r border-gray-200 sticky top-0 h-screen">
          <Sidebar role="admin" />
        </aside>
        <main className="flex-1 p-8 max-w-5xl mx-auto">
          <p>Loading...</p>
        </main>
      </div>
    );

  return (
    <div className="flex min-h-screen bg-white text-black">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-200 sticky top-0 h-screen">
        <Sidebar role="admin" />
      </aside>

      {/* Main */}
      <main className="flex-1 p-8 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#0F3659]">
              Request to move out
            </h1>
            <p className="text-gray-600 mt-1">
              Manage all tenant move-out requests in the system.
            </p>
          </div>
          <div className="text-sm text-gray-600">
            All:{" "}
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
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Room number</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Moving date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Detail</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr
                    key={req.id}
                    className="border-t border-gray-200 hover:bg-gray-200 transition-colors"
                  >
                    <td className="px-4 py-3">
                      {req.user.firstName} {req.user.lastName}
                    </td>
                    <td className="px-4 py-3">{req.room.roomNumber}</td>
                    <td className="px-4 py-3">{req.reason}</td>
                    <td className="px-4 py-3">
                      {new Date(req.moveOutDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 font-medium flex items-center gap-2">
                      {req.status === "PENDING_APPROVAL" && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 font-semibold text-sm">
                          <i className="ri-indeterminate-circle-fill"></i>{" "}
                          Pending
                        </span>
                      )}
                      {req.status === "APPROVED" && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 font-semibold text-sm">
                          <i className="ri-checkbox-circle-fill"></i> Approved
                        </span>
                      )}
                      {req.status === "REJECTED" && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 text-red-700 font-semibold text-sm">
                          <i className="ri-close-circle-fill"></i> Rejected
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded text-sm"
                        onClick={() => router.push(`/admin/moveout/${req.id}`)}
                      >
                        View Detail
                      </button>
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
