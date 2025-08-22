"use client";
 
import { use, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import Link from "next/link";
import Sidebar from "@/components/sidebar";
import dayjs from "dayjs";
 
type RoomDetail = {
  id: string;
  roomNumber: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  maintenanceCount?: number;
  tenant: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  } | null;
};
 
export default function RoomDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params); // ✅ ใช้ use() เพื่อดึง id ออกจาก Promise
 
  const [room, setRoom] = useState<RoomDetail | null>(null);
  const [loading, setLoading] = useState(true);
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
 
  // ✅ ลบห้อง
  const handleDelete = async () => {
    const confirmDelete = window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบห้องนี้?");
    if (!confirmDelete) return;
 
    try {
      const res = await fetch(`/api/admin/rooms/${id}`, {
        method: "DELETE",
      });
 
      if (!res.ok) {
        const data = await res.json();
        console.error("ลบห้องไม่สำเร็จ:", data);
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
 
  if (loading) {
    return <div className="text-center mt-10 text-gray-500">กำลังโหลดข้อมูลห้อง...</div>;
  }
 
  if (!room) {
    return <div className="text-center mt-10 text-red-500">ไม่พบข้อมูลห้อง</div>;
  }
 
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role="admin" />
 
      <div className="flex-1 p-8 max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 ">Room {room.roomNumber}</h1>
        <p className="text-gray-500 mb-8">Manage room information</p>
 
        <div className="space-y-2 mb-8">
          <h2 className="text-xl font-semibold text-blue-950">Room Info</h2>
          <div className="bg-white shadow-md rounded-lg p-2">
            <div className="divide-y divide-gray-200">
              <div className="grid grid-cols-2 py-2">
                <strong className="flex justify-between py-2 p-2 text-gray-700">Status</strong>
                <span className="text-right text-gray-900 p-2">
                  {room.status === "OCCUPIED"
                    ? "Occupied"
                    : room.status === "AVAILABLE"
                    ? "Available"
                    : "Maintenance"}
                </span>
              </div>
              {room.createdAt && (
                <div className="grid grid-cols-2 py-2">
                  <strong className="flex justify-between py-2 p-2 text-gray-700">Created At</strong>
                  <span className="text-right text-gray-900 p-2">
                    {dayjs(room.createdAt).format("DD/MM/YYYY")}
                  </span>
                </div>
              )}
              {room.updatedAt && (
                <div className="grid grid-cols-2 py-2">
                  <strong className="flex justify-between py-2 p-2 text-gray-700">Updated At</strong>
                  <span className="text-right text-gray-900 p-2">
                    {dayjs(room.updatedAt).format("DD/MM/YYYY HH:mm")}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
 
        {room.tenant ? (
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-blue-950">Tenant information</h2>
            <div className="bg-white shadow-md rounded-lg p-2">
              <div className="divide-y divide-gray-200">
                <div className="grid grid-cols-2 py-2">
                  <strong className="flex justify-between py-2 p-2 text-gray-700">Name</strong>
                  <span className="text-right">{room.tenant.firstName} {room.tenant.lastName}</span>
                </div>
                <div className="grid grid-cols-2 py-2">
                  <strong className="flex justify-between py-2 p-2 text-gray-700">Email</strong>
                  <span className="text-right">{room.tenant.email}</span>
                </div>
                <div className="grid grid-cols-2 py-2">
                  <strong className="flex justify-between py-2 p-2 text-gray-700">Phone number</strong>
                  <span className="text-right">{room.tenant.phone ?? "-"}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 italic">This room currently has no tenant.</p>
        )}
 
        <div className="mt-6 flex justify-between">
          <Link href="/admin/rooms">
            <button className="inline-block bg-gray-200 text-gray-900 px-4 py-2 rounded hover:bg-gray-300 text-sm transition duration-200 transform hover:scale-105">
              Back to All Room
            </button>
          </Link>
 
        {/*  แสดงปุ่มลบเฉพาะห้องที่ไม่มีผู้เช่า */}
        {!room.tenant && (
          <button
            onClick={handleDelete}
            className="bg-gray-600 text-white px-4 py-2 rounded  hover:transition duration-200 transform hover:scale-105 text-sm"
          >
            Delete Room
          </button>
          )}
        </div>
      </div>
    </div>
  );
}
 