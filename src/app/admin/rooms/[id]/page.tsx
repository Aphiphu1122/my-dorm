"use client";

import { use, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import Link from "next/link";
import Sidebar from "@/components/sidebar";
import dayjs from "dayjs";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Trash2,
  ArrowLeft,
  Clock,
  Info,
} from "lucide-react";

type RoomDetail = {
  id: string;
  roomNumber: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  assignedAt?: string;
  tenant: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    roomStartDate?: string;
  } | null;
};

export default function RoomDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [room, setRoom] = useState<RoomDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"room" | "tenant" | "timeline">("room");
  const router = useRouter();

  const fetchRoom = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/rooms/${id}`, { cache: "no-store" });
      if (!res.ok) {
        console.error("โหลดข้อมูลห้องไม่สำเร็จ:", await res.text());
        return setRoom(null);
      }
      const data = await res.json();
      setRoom(data.room);
    } catch (error) {
      console.error("เกิดข้อผิดพลาดขณะโหลดข้อมูลห้อง:", error);
      toast.error("โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchRoom();
  }, [fetchRoom]);

  const handleDelete = async () => {
    if (!window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบห้องนี้?")) return;
    try {
      const res = await fetch(`/api/admin/rooms/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "ลบไม่สำเร็จ");
        return;
      }
      toast.success("ลบห้องสำเร็จ");
      router.push("/admin/rooms");
    } catch (error) {
      console.error("เกิดข้อผิดพลาดขณะลบห้อง:", error);
      toast.error("เกิดข้อผิดพลาดในการลบ");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OCCUPIED":
        return <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">Occupied</span>;
      case "AVAILABLE":
        return <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-medium">Available</span>;
      default:
        return <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium">Maintenance</span>;
    }
  };

  return (
     <div className="flex min-h-screen bg-white">
      <aside className="w-64 border-r border-gray-200 sticky top-0 h-screen">
        <Sidebar role="admin" />
      </aside>

      <main className="flex-1 p-8 max-w-6xl mx-auto">
        {loading ? (
          <div className="flex justify-center items-center h-96 text-gray-500 text-lg">
          ...Loading room information...
          </div>
        ) : !room ? (
          <div className="flex justify-center items-center h-96 text-red-500 text-lg">
            ❌ Room information not found
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="mb-8 flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Room {room.roomNumber}
                </h1>
                <p className="text-gray-500 mt-1">Room and tenant details</p>
              </div>
              {getStatusBadge(room.status)}
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="-mb-px flex space-x-6">
                <button
                  className={`pb-2 text-sm font-medium ${
                    activeTab === "room"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => setActiveTab("room")}
                >
                  <Info className="inline w-4 h-4 mr-1" /> Room Info
                </button>
                <button
                  className={`pb-2 text-sm font-medium ${
                    activeTab === "tenant"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => setActiveTab("tenant")}
                >
                  <User className="inline w-4 h-4 mr-1" /> Tenant Info
                </button>
                <button
                  className={`pb-2 text-sm font-medium ${
                    activeTab === "timeline"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => setActiveTab("timeline")}
                >
                  <Clock className="inline w-4 h-4 mr-1" /> Timeline
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-xl shadow p-6">
              {activeTab === "room" && (
                <div className="space-y-3 text-gray-700">
                  <p><span className="font-medium">Status:</span> {getStatusBadge(room.status)}</p>
                  {room.assignedAt && (
                    <p><span className="font-medium">Assigned At:</span> {dayjs(room.assignedAt).format("DD/MM/YYYY")}</p>
                  )}
                  {room.createdAt && (
                    <p><span className="font-medium">Created At:</span> {dayjs(room.createdAt).format("DD/MM/YYYY")}</p>
                  )}
                  {room.updatedAt && (
                    <p><span className="font-medium">Updated At:</span> {dayjs(room.updatedAt).format("DD/MM/YYYY HH:mm")}</p>
                  )}
                </div>
              )}

              {activeTab === "tenant" && (
                <div>
                  {room.tenant ? (
                    <div className="space-y-3 text-gray-700">
                      <p className="flex items-center gap-2"><User className="w-4 h-4 text-gray-500" /> {room.tenant.firstName} {room.tenant.lastName}</p>
                      <p className="flex items-center gap-2"><Mail className="w-4 h-4 text-gray-500" /> {room.tenant.email}</p>
                      <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-500" /> {room.tenant.phone ?? "-"}</p>
                      {room.tenant.roomStartDate && (
                        <p className="flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-500" /> Check-in: {dayjs(room.tenant.roomStartDate).format("DD/MM/YYYY")}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">There are no tenants in this room.</p>
                  )}
                </div>
              )}

              {activeTab === "timeline" && (
                <ul className="space-y-3 text-gray-700">
                  {room.createdAt && (
                    <li>🟢 Created on {dayjs(room.createdAt).format("DD MMM YYYY")}</li>
                  )}
                  {room.assignedAt && (
                    <li>🟡 Assigned on {dayjs(room.assignedAt).format("DD MMM YYYY")}</li>
                  )}
                  {room.updatedAt && (
                    <li>🔄 Last updated {dayjs(room.updatedAt).format("DD MMM YYYY HH:mm")}</li>
                  )}
                </ul>
              )}
            </div>

            {/* Actions */}
            <div className="mt-10 flex justify-between">
              <Link href="/admin/rooms">
                <button className="inline-flex items-center gap-2 bg-gray-200 text-gray-900 px-5 py-2.5 rounded-lg hover:bg-gray-300 transition text-sm font-medium">
                  <ArrowLeft className="w-4 h-4" /> Back to All Rooms
                </button>
              </Link>

              {!room.tenant && (
                <button
                  onClick={handleDelete}
                  className="inline-flex items-center gap-2 bg-red-600 text-white px-5 py-2.5 rounded-lg hover:bg-red-700 transition text-sm font-medium"
                >
                  <Trash2 className="w-4 h-4" /> Delete Room
                </button>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}