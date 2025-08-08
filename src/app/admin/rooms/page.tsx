"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation"; 
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
  const router = useRouter();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [newRoomNumber, setNewRoomNumber] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | RoomStatus>("ALL");

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/rooms", { credentials: "include" });
      const data = await res.json();
      if (Array.isArray(data.rooms)) {
        setRooms(data.rooms);
      } else {
        setRooms([]);
      }
    } catch {
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

  const handleDeleteRoom = async (
    e: React.MouseEvent,
    roomId: string,
    roomNumber: string
  ) => {
    e.stopPropagation();
    if (!confirm(`คุณต้องการลบห้อง ${roomNumber} หรือไม่?`)) return;
    const res = await fetch(`/api/admin/rooms/${roomId}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) {
      toast.success(`ลบห้อง ${roomNumber} สำเร็จ`);
      fetchRooms();
    } else {
      const data = await res.json();
      toast.error(`ลบห้องไม่สำเร็จ: ${data.error}`);
    }
  };

  const handleStatusChange = async (
    e: React.ChangeEvent<HTMLSelectElement>,
    roomId: string
  ) => {
    e.stopPropagation();
    const newStatus = e.target.value as RoomStatus;
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
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role="admin" />

      <div className="flex-1 p-8 max-w-5xl mx-auto">
        <Toaster position="top-right" reverseOrder={false} />

        {/* Header + Add Room */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">All Rooms</h1>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <input
              type="text"
              className="border border-gray-300 rounded-md px-4 py-2 w-full sm:w-48 focus:outline-none focus:ring-2 focus:ring-[#0F3659]"
              placeholder="Room number"
              value={newRoomNumber}
              onChange={(e) => setNewRoomNumber(e.target.value)}
            />
            <button
              className="bg-[#0F3659] text-white px-6 py-2 rounded-md hover:scale-105 transition duration-200"
              onClick={handleAddRoom}
            >
              + Add Room
            </button>
          </div>
        </div>

        {/* Filter */}
        <div className="mb-6 flex items-center gap-3">
          <label htmlFor="filterStatus" className="font-semibold text-gray-700">
            Filter Status:
          </label>
          <select
            id="filterStatus"
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
            value={filterStatus}
            onChange={(e) =>
              setFilterStatus(e.target.value as RoomStatus | "ALL")
            }
          >
            <option value="ALL">All</option>
            <option value="AVAILABLE">Available</option>
            <option value="OCCUPIED">Occupied</option>
            <option value="MAINTENANCE">Maintenance</option>
          </select>
        </div>

        {/* Rooms grid */}
        {loading ? (
          <div className="flex justify-center items-center p-16">
            <div className="animate-spin rounded-full h-14 w-14 border-t-4 border-blue-600 border-b-transparent"></div>
          </div>
        ) : filteredRooms.length === 0 ? (
          <p className="text-center text-gray-500 text-lg mt-10">No rooms found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredRooms.map((room) => (
              <div
                key={room.id}
                onClick={() => router.push(`/admin/rooms/${room.id}`)}
                className={`relative rounded-lg p-4 shadow-md transition-transform duration-300 cursor-pointer
                  hover:scale-105 hover:shadow-lg
                  ${
                    room.status === "OCCUPIED"
                      ? "bg-[#88D64C] text-white"
                      : room.status === "MAINTENANCE"
                      ? "bg-[#FFAE00] text-white"
                      : "bg-gray-200 text-gray-900"
                  }
                `}
                aria-label={`Room ${room.roomNumber}, status ${room.status}`}
              >
                {/* Delete button */}
                <button
                  onClick={(e) => handleDeleteRoom(e, room.id, room.roomNumber)}
                  className="absolute top-3 right-3 bg-gray-400 hover:bg-gray-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-lg font-bold transition"
                  aria-label={`Delete room ${room.roomNumber}`}
                >
                  ×
                </button>

                {/* Room Number */}
                <h2 className="text-2xl font-bold mb-2">{room.roomNumber}</h2>

                {/* Status text */}
                <p className="mb-3 font-medium capitalize">{room.status.toLowerCase()}</p>

                {/* Status select */}
                <select
                  aria-label={`Change status for room ${room.roomNumber}`}
                  value={room.status}
                  onChange={(e) => handleStatusChange(e, room.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full text-gray-900 rounded-md px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                >
                  <option value="AVAILABLE">Available</option>
                  <option value="OCCUPIED">Occupied</option>
                  <option value="MAINTENANCE">Maintenance</option>
                </select>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
