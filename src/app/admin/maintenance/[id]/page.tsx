"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import Sidebar from "@/components/sidebar";
import { toast } from "react-hot-toast";

interface MaintenanceRequest {
  id: string;
  description: string;
  status: string;
  category: string;
  imageUrls?: string[];
  createdAt: string;
  room: { roomNumber: string };
  user: { firstName: string; lastName: string; email: string; phone: string };
}

export default function MaintenanceDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [request, setRequest] = useState<MaintenanceRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!id || typeof id !== "string") return;

    const fetchRequest = async () => {
      try {
        const res = await fetch(`/api/admin/maintenance/${id}`);
        if (!res.ok) throw new Error("ไม่พบข้อมูล");
        const data = await res.json();
        setRequest(data.request);
      } catch (error) {
        console.error(error);
        toast.error("ไม่พบข้อมูลการแจ้งซ่อม");
        router.push("/admin/maintenance");
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
  }, [id, router]);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "PENDING":
        return { label: "⏳ รอดำเนินการ", color: "bg-yellow-100 text-yellow-800" };
      case "IN_PROGRESS":
        return { label: "🟡 กำลังดำเนินการ", color: "bg-blue-100 text-blue-800" };
      case "COMPLETED":
        return { label: "🟢 เสร็จสิ้น", color: "bg-green-100 text-green-800" };
      case "CANCEL":
        return { label: "🔴 ยกเลิก", color: "bg-red-100 text-red-800" };
      default:
        return { label: "ไม่ทราบสถานะ", color: "bg-gray-100 text-gray-700" };
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!request) return;

    try {
      setUpdating(true);
      const res = await fetch(`/api/admin/maintenance/${request.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      toast.success("อัปเดตสถานะเรียบร้อยแล้ว");
      router.refresh();
    } catch {
      toast.error("อัปเดตล้มเหลว");
    } finally {
      setUpdating(false);
    }
  };

  if (loading)
    return <p className="text-center mt-16 text-gray-600">กำลังโหลด...</p>;
  if (!request)
    return <p className="text-center mt-16 text-red-600">ไม่พบข้อมูลการแจ้งซ่อม</p>;

  const status = getStatusLabel(request.status);

  return (
    <div className="flex min-h-screen bg-white">
      <aside className="w-64 border-r border-gray-200 sticky top-0 h-screen">
        <Sidebar role="admin" />
      </aside>

      <main className="flex-1 p-8 max-w-6xl mx-auto">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold text-gray-900">
              รายละเอียดการแจ้งซ่อม
            </h1>
            <span
              className={`px-4 py-2 rounded-full font-semibold text-sm ${status.color}`}
            >
              {status.label}
            </span>
          </div>

          {/* Info Card */}
          <div className="bg-white shadow-lg rounded-2xl p-8 mb-8 border border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              ข้อมูลคำร้อง
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-700">
              <div>
                <p className="text-gray-500 text-sm">รหัสคำร้อง</p>
                <p className="font-medium">{request.id}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">วันที่แจ้ง</p>
                <p className="font-medium">
                  {new Date(request.createdAt).toLocaleString("th-TH")}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">ห้อง</p>
                <p className="font-medium">{request.room.roomNumber}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">ประเภทงานซ่อม</p>
                <p className="font-medium">{request.category}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-gray-500 text-sm mb-1">รายละเอียด</p>
                <p className="text-gray-800">{request.description}</p>
              </div>
            </div>
          </div>

          {/* Reporter Info */}
          <div className="bg-white shadow-lg rounded-2xl p-8 mb-8 border border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              ผู้แจ้ง
            </h2>
            <div className="text-gray-700">
              <p className="font-medium">
                {request.user.firstName} {request.user.lastName}
              </p>
              <p className="text-gray-500 text-sm">{request.user.email}</p>
              <p className="text-gray-500 text-sm">{request.user.phone}</p>
            </div>
          </div>

          {/* Images Card */}
          {request.imageUrls && request.imageUrls.length > 0 && (
            <div className="bg-white shadow-lg rounded-2xl p-6 mb-8 border border-gray-200">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                รูปภาพที่แนบมา
              </h2>
              <div className="flex flex-wrap gap-4 overflow-x-auto pb-2">
                {request.imageUrls.map((url, index) => (
                  <div key={index} className="flex-shrink-0">
                    <Image
                      src={url}
                      alt={`รูปแจ้งซ่อม ${index + 1}`}
                      width={250}
                      height={150}
                      className="rounded-xl border"
                      unoptimized
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Update Status */}
          <div className="bg-white shadow-lg rounded-2xl p-8 border border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              อัปเดตสถานะ
            </h2>
            <div className="flex flex-col md:justify-start gap-4 mb-6">
              <select
                id="status"
                className="border border-gray-300 px-4 py-2 rounded w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={request.status}
                onChange={(e) => handleUpdateStatus(e.target.value)}
                disabled={updating}
              >
                <option value="PENDING">⏳ รอดำเนินการ</option>
                <option value="IN_PROGRESS">🟡 กำลังดำเนินการ</option>
                <option value="COMPLETED">🟢 เสร็จสิ้น</option>
                <option value="CANCEL">🔴 ยกเลิก</option>
              </select>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => router.back()}
                className="px-6 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition duration-200"
              >
                กลับ
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
