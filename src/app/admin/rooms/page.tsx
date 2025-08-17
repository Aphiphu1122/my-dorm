"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";
import Sidebar from "@/components/sidebar";


type RoomStatus = "AVAILABLE" | "OCCUPIED" | "MAINTENANCE";

type Room = {
  id: string;
  roomNumber: string;
  status: RoomStatus;
  tenant?: {
    firstName: string;
    lastName: string;
    email: string;
  };
};

export default function RoomManagementPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [newRoomNumber, setNewRoomNumber] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | RoomStatus>("ALL");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/admin/rooms", {
        credentials: "include",
      });

      const data = await res.json();

      if (
        res.ok &&
        typeof data === "object" &&
        data !== null &&
        Array.isArray(data.rooms)
      ) {
        setRooms(data.rooms);
      } else {
        console.warn("❗️โครงสร้าง response ไม่ถูกต้อง:", data);
        toast.error("ข้อมูลห้องไม่ถูกต้อง");
        setRooms([]);
      }
    } catch (error) {
      console.error("❌ โหลดข้อมูลห้องล้มเหลว:", error);
      toast.error("โหลดข้อมูลห้องล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  const handleAddRoom = async () => {
    if (!newRoomNumber.trim()) {
      toast.error("กรุณากรอกหมายเลขห้อง");
      return;
    }

    const res = await fetch("/api/admin/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ roomNumber: newRoomNumber }),
    });

    if (res.ok) {
      setNewRoomNumber("");
      toast.success("เพิ่มห้องสำเร็จ");
      fetchRooms();
    } else {
      const data = await res.json();
      toast.error(`ไม่สามารถเพิ่มห้องได้: ${data.error}`);
    }
  };

  const handleDeleteRoom = async (roomId: string, roomNumber: string) => {
    setDeleting(true);
    const res = await fetch(`/api/admin/rooms/${roomId}`, {
      method: "DELETE",
      credentials: "include",
    });
    setDeleting(false);
    setShowDeleteModal(false);

    if (res.ok) {
      toast.success(`ลบห้อง ${roomNumber} สำเร็จ`);
      fetchRooms();
    } else {
      const data = await res.json();
      toast.error(`ลบห้องไม่สำเร็จ: ${data.error}`);
    }
  };

  const handleStatusChange = async (roomId: string, newStatus: RoomStatus) => {
    const res = await fetch(`/api/admin/rooms/${roomId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status: newStatus }),
    });

    if (res.ok) {
      toast.success("อัปเดตสถานะเรียบร้อย");
      fetchRooms();
    } else {
      const data = await res.json();
      toast.error(`อัปเดตสถานะไม่สำเร็จ: ${data.error}`);
    }
  };

  const filteredRooms = useMemo(() => {
    if (filterStatus === "ALL") return rooms;
    return rooms.filter((room) => room.status === filterStatus);
  }, [rooms, filterStatus]);

  return (
    <>
      <div className="flex min-h-screen">
        {/* Sidebar ซ้าย */}
        <Sidebar role="admin" />

        {/* คอลัมน์ขวา: เอา padding ด้านข้างออกให้เต็มจอ */}
        <div className="flex-1 w-full px-0 py-6">
          <Toaster position="top-right" />

          {/* ตัด max-w-5xl และ mx-auto ออก เพื่อให้กว้างเต็ม */}
          <div className="w-full">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-6 px-4 md:px-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">All Rooms</h1>
                <p className="text-gray-600">จัดการห้องพักและสถานะ</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                {/* Filter */}
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="filter"
                    className="font-medium text-gray-700 whitespace-nowrap"
                  >
                    กรองสถานะ:
                  </label>
                  <select
                    id="filter"
                    className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0F3659]"
                    value={filterStatus}
                    onChange={(e) =>
                      setFilterStatus(e.target.value as "ALL" | RoomStatus)
                    }
                  >
                    <option value="ALL">ทั้งหมด</option>
                    <option value="AVAILABLE">ว่าง</option>
                    <option value="OCCUPIED">มีผู้เช่า</option>
                    <option value="MAINTENANCE">กำลังซ่อม</option>
                  </select>
                </div>

                {/* Add Room */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="border border-gray-300 rounded-md px-4 py-2 w-full sm:w-52 focus:outline-none focus:ring-2 focus:ring-[#0F3659]"
                    placeholder="Room number"
                    value={newRoomNumber}
                    onChange={(e) => setNewRoomNumber(e.target.value)}
                  />
                  <button
                    className="bg-[#0F3659] text-white px-5 py-2 rounded-md hover:scale-105 transition"
                    onClick={handleAddRoom}
                  >
                    + Add
                  </button>
                </div>
              </div>
            </div>

            {/* เนื้อหา: Loading / Empty / Grid */}
            {loading ? (
              <div className="flex justify-center items-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-[#0F3659] border-b-transparent border-solid" />
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="py-16 text-center text-gray-600">ไม่มีห้องที่ตรงกับเงื่อนไข</div>
            ) : (

              <div className="px-4 md:px-6">
                <div className="grid [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))] gap-4">
                  {filteredRooms.map((room) => {
                    const isOccupied = room.status === "OCCUPIED";
                    const isMaint = room.status === "MAINTENANCE";
                    const cardClass =
                      isOccupied
                        ? "bg-[#88D64C] text-white"
                        : isMaint
                        ? "bg-[#FFAE00] text-white"
                        : "bg-gray-200 text-gray-900";
                    return (
                      <div
                        key={room.id}
                        className={`rounded-lg p-4 text-center relative shadow-sm ${cardClass}`}
                      >
                        {/* ปุ่มลบ */}
                        <button
                          onClick={() => {
                            setSelectedRoom(room);
                            setShowDeleteModal(true);
                          }}
                          className="absolute top-2 right-2 bg-black/20 hover:bg-black/40 text-white rounded-full w-7 h-7 flex items-center justify-center text-lg font-bold transition"
                          aria-label={`Delete room ${room.roomNumber}`}
                          title="Delete"
                        >
                          ×
                        </button>

                        <Link href={`/admin/rooms/${room.id}`}>
                          <div className="font-extrabold text-xl cursor-pointer">
                            {room.roomNumber}
                          </div>
                        </Link>

                        <div className="text-sm mt-1">
                          Status:{" "}
                              {room.status === "AVAILABLE"
                          ? "Available"
                          : room.status === "OCCUPIED"
                          ? "Occupied"
                          : "Maintenance"}
                      </div>
                        <select
                          className="mt-3 text-black bg-white/90 p-2 rounded-md w-full"
                          value={room.status}
                          onChange={(e) =>
                            handleStatusChange(room.id, e.target.value as RoomStatus)
                          }
                        >
                          <option value="AVAILABLE">Available</option>
                          <option value="OCCUPIED">Occupied</option>
                          <option value="MAINTENANCE">Maintenance</option>
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal ยืนยันการลบ */}
      {showDeleteModal && selectedRoom && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="bg-white p-6 rounded-lg max-w-sm w-full text-center shadow-xl border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-4">
              คุณต้องการลบห้อง {selectedRoom.roomNumber} ใช่หรือไม่?
            </h2>
            <div className="flex justify-center gap-3">
              <button
                className={`bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 ${
                  deleting ? "opacity-50 cursor-not-allowed" : ""
                }`}
                onClick={() =>
                  handleDeleteRoom(selectedRoom.id, selectedRoom.roomNumber)
                }
                disabled={deleting}
              >
                {deleting ? "⏳ กำลังลบ..." : "✅ ยืนยัน"}
              </button>
              <button
                className="bg-gray-200 text-gray-900 px-4 py-2 rounded"
                onClick={() => setShowDeleteModal(false)}
              >
                ❌ ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}