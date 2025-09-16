"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast, Toaster } from "react-hot-toast";
import Sidebar from "@/components/sidebar";
import dayjs from "dayjs";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Trash2,
  ArrowLeft,
  Info,
} from "lucide-react";

/* =============== Types =============== */
type RoomStatus = "AVAILABLE" | "OCCUPIED" | "MAINTENANCE";

type TenantMini =
  | {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      roomStartDate?: string | null;
    }
  | null;

type RoomDetail = {
  id: string;
  roomNumber: string;
  status: RoomStatus;
  createdAt?: string;
  updatedAt?: string;
  assignedAt?: string | null;
  tenant: TenantMini;
};

type RoomShowApi = { success: boolean; room: RoomDetail };
function isRoomShowApi(x: unknown): x is RoomShowApi {
  return typeof x === "object" && x !== null && "room" in x;
}

/* =============== Page =============== */
export default function RoomDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [room, setRoom] = useState<RoomDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"room" | "tenant">("room");
  const router = useRouter();

  const fetchRoom = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/rooms/${id}`, {
        credentials: "include",
        cache: "no-store",
      });
      const data: unknown = await res.json();
      if (!res.ok || !isRoomShowApi(data) || !data.success) {
        toast.error("โหลดข้อมูลห้องไม่สำเร็จ");
        setRoom(null);
        return;
      }
      setRoom(data.room);
    } catch (error) {
      console.error("load room error:", error);
      toast.error("โหลดข้อมูลไม่สำเร็จ");
      setRoom(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchRoom();
  }, [fetchRoom]);

  const handleDelete = async () => {
    if (!room) return;
    if (room.tenant) {
      toast.error("ห้องนี้มีผู้เช่าอยู่ ไม่สามารถลบได้");
      return;
    }
    if (!window.confirm(`ลบห้อง ${room.roomNumber}?`)) return;

    try {
      const res = await fetch(`/api/admin/rooms/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        toast.error(data?.error || "ลบไม่สำเร็จ");
        return;
      }
      toast.success("ลบห้องสำเร็จ");
      router.push("/admin/rooms");
    } catch (error) {
      console.error("delete room error:", error);
      toast.error("เกิดข้อผิดพลาดในการลบ");
    }
  };

  const getStatusBadge = (status: RoomStatus) => {
    switch (status) {
      case "OCCUPIED":
        return (
          <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
            Occupied
          </span>
        );
      case "AVAILABLE":
        return (
          <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
            Available
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
            Maintenance
          </span>
        );
    }
  };

  const fmt = (d?: string | null, withTime = false) =>
    d ? dayjs(d).format(withTime ? "DD/MM/YYYY HH:mm" : "DD/MM/YYYY") : "-";

  const tenantName = useMemo(() => {
    if (!room?.tenant) return "-";
    const { firstName = "", lastName = "" } = room.tenant;
    const n = `${firstName} ${lastName}`.trim();
    return n || "-";
  }, [room?.tenant]);

  return (
    <div className="flex min-h-screen bg-white">
      <aside className="w-64 border-r border-gray-200 sticky top-0 h-screen">
        <Sidebar role="admin" />
      </aside>

      <main className="flex-1 p-8 max-w-6xl mx-auto">
        <Toaster position="top-right" />

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

            {/* Tabs (เหลือ 2 อัน) */}
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
              </nav>
            </div>

            {/* Content */}
            <div className="bg-white rounded-xl shadow p-6">
              {activeTab === "room" && (
                <div className="space-y-3 text-gray-700">
                  <div>
                    <span className="font-medium">Status:</span>{" "}
                    {getStatusBadge(room.status)}
                  </div>
                  <p>
                    <span className="font-medium">วันที่มอบหมายห้อง (ระบบ):</span>{" "}
                    {fmt(room.assignedAt)}
                  </p>
                  <p>
                    <span className="font-medium">สร้างเมื่อ:</span>{" "}
                    {fmt(room.createdAt)}
                  </p>
                  <p>
                    <span className="font-medium">แก้ไขล่าสุด:</span>{" "}
                    {fmt(room.updatedAt, true)}
                  </p>
                </div>
              )}

              {activeTab === "tenant" && (
                <div>
                  {room.tenant ? (
                    <div className="space-y-3 text-gray-700">
                      <p className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500" /> {tenantName}
                      </p>
                      {room.tenant.email && (
                        <p className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-500" />
                          <a
                            className="underline"
                            href={`mailto:${room.tenant.email}`}
                          >
                            {room.tenant.email}
                          </a>
                        </p>
                      )}
                      <p className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-500" />{" "}
                        {room.tenant.phone ?? "-"}
                      </p>
                      <p className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" /> วันที่เข้าพักจริง:{" "}
                        {fmt(room.tenant.roomStartDate ?? null)}
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">ห้องนี้ยังไม่มีผู้เช่า</p>
                  )}
                </div>
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
