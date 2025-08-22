"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Image from "next/image";
import Link from "next/link";
import Sidebar from "@/components/sidebar";

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

      setRequest((prev) => (prev ? { ...prev, status } : prev));
      toast.success(`อัปเดตสถานะสำเร็จ`);
      router.push("/admin/moveout");
    } catch (err) {
      console.error(err);
      toast.error("เกิดข้อผิดพลาด");
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-200 sticky top-0 h-screen">
        <Sidebar role="admin" />
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 max-w-5xl mx-auto">
        {loading ? (
          <div className="bg-white rounded-xl shadow p-8 text-center text-gray-600">
            Loading...
          </div>
        ) : !request ? (
          <div className="bg-white rounded-xl shadow p-8 text-center text-red-500">
            Request information not found
          </div>
        ) : (
          <div className="bg-white  p-6 ">
            <h1 className="text-3xl font-bold text-blue-900 mb-4">
              Detail request to move out
            </h1>
          
          
        <div className="rounded-lg shadow border border-gray-200">
        
              <div className="grid grid-cols-2 px-6 py-4 border-b border-gray-200">
                  <p className="text-gray-700 font-semibold">Name</p>
                  <p className="text-gray-900 text-end">
                    {request.user.firstName} {request.user.lastName}
                  </p>
              </div>

               <div className="grid grid-cols-2 px-6 py-4 border-b border-gray-200">
                <p className="text-gray-700 font-semibold">Email</p>
                <p className="text-gray-900 text-end">{request.user.email}</p>
              </div>

              <div className="grid grid-cols-2 px-6 py-4 border-b border-gray-200">
                <p className="text-gray-700 font-semibold">Room number</p>
                <p className="text-gray-900 text-end">{request.room.roomNumber}</p>
              </div>

               <div className="grid grid-cols-2 px-6 py-4 border-b border-gray-200">
                <p className="text-gray-700 font-semibold">Date request</p>
                <p className="text-gray-900 text-end">
                  {new Date(request.createdAt).toLocaleDateString()}
                </p>
              </div>

               <div className="grid grid-cols-2 px-6 py-4 border-b border-gray-200">
                <p className="text-gray-700 font-semibold">Date wish to move out</p>
                <p className="text-gray-900 text-end">
                  {new Date(request.moveOutDate).toLocaleDateString()}
                </p>
              </div>

             <div className="grid grid-cols-2 px-6 py-4 border-b border-gray-200">
              <p className="text-gray-700 font-semibold">Reason</p>
              <p className="text-gray-900 text-end">{request.reason}</p>
            </div>

            {request.note && (
              <div className="flex justify-between px-6 py-4 border-b border-gray-200">
                <p className="text-gray-700 font-semibold">Note</p>
                <p className="text-gray-900 text-right">{request.note}</p>
              </div>
            )}


            {request.imageUrl && (
              <div>
                <p className="text-gray-700 font-semibold mb-2">Img</p>
                <div className="border rounded-lg overflow-hidden w-full max-w-md">
                  <Image
                    src={request.imageUrl}
                    alt="รูปภาพแนบ"
                    width={400}
                    height={300}
                    className="object-cover w-full h-full"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 px-6 py-4 border-b border-gray-200">
              <p className="text-gray-700 font-semibold mb-1">Status</p>
              <div className="flex items-center justify-end gap-2">
                {request.status === "PENDING_APPROVAL" && (
                  <span className="flex items-center gap-1 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full font-medium text-sm">
                    Pending
                    <i className="ri-indeterminate-circle-fill text-yellow-600 text-lg"></i>
                  </span>
                )}
                {request.status === "APPROVED" && (
                  <span className="flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium text-sm">
                    Approved
                    <i className="ri-checkbox-circle-fill text-green-600 text-lg"></i>
                  </span>
                )}
                {request.status === "REJECTED" && (
                  <span className="flex items-center gap-1 bg-red-100 text-red-800 px-3 py-1 rounded-full font-medium text-sm">
                    Rejected
                    <i className="ri-close-circle-fill text-red-600 text-lg"></i>
                  </span>
                )}
              </div>
            </div>


          </div>

            {request.status === "PENDING_APPROVAL" && (
              <div className="mt-4 flex gap-4">
                <button
                  onClick={() => handleUpdateStatus("APPROVED")}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition font-semibold shadow"
                >
                  Approved
                </button>
                <button
                  onClick={() => handleUpdateStatus("REJECTED")}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition font-semibold shadow"
                >
                  Rejected
                </button>
              </div>
            )}
            

            {/* ปุ่ม Back */}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => router.push("/admin/moveout")}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md font-medium shadow"
                >
                  ← Back
                </button>
              </div>
          </div>
        )}
      </main>
    </div>
  );
}
