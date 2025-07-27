"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const res = await fetch("/api/admin/rooms", { credentials: "include" });
      const data = await res.json();
      setRooms(data.rooms);
    } catch (err) {
      console.error("โหลดข้อมูลห้องล้มเหลว:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRoom = async () => {
    if (!newRoomNumber.trim()) return alert("กรุณากรอกหมายเลขห้อง");

    const res = await fetch("/api/admin/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ roomNumber: newRoomNumber }),
    });

    if (res.ok) {
      setNewRoomNumber("");
      fetchRooms();
    } else {
      const data = await res.json();
      alert(`ไม่สามารถเพิ่มห้องได้: ${data.error}`);
    }
  };

  const handleDeleteRoom = async (roomId: string, roomNumber: string) => {
    const confirmDelete = confirm(`คุณต้องการลบห้อง ${roomNumber} หรือไม่?`);
    if (!confirmDelete) return;

    const res = await fetch(`/api/admin/rooms/${roomId}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (res.ok) {
      fetchRooms();
    } else {
      const data = await res.json();
      alert(`ลบห้องไม่สำเร็จ: ${data.error}`);
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
      fetchRooms();
    } else {
      const data = await res.json();
      alert(`อัปเดตสถานะไม่สำเร็จ: ${data.error}`);
    }
  };

  if (loading) return <p className="p-6">กำลังโหลดข้อมูล...</p>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">All Rooms</h1>
        <div className="flex gap-2">
          <input
            type="text"
            className="border px-2 py-1 rounded"
            placeholder="หมายเลขห้อง"
            value={newRoomNumber}
            onChange={(e) => setNewRoomNumber(e.target.value)}
          />
          <button
            className="bg-blue-900 text-white px-4 py-2 rounded"
            onClick={handleAddRoom}
          >
            ➕ เพิ่มห้อง
          </button>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4">
        {rooms.map((room) => (
          <div
            key={room.id}
            className={`rounded p-4 text-center relative ${
              room.status === "OCCUPIED"
                ? "bg-green-400 text-white"
                : room.status === "MAINTENANCE"
                ? "bg-yellow-400 text-white"
                : "bg-gray-300 text-gray-800"
            }`}
          >
            {/* 🔴 ปุ่มลบ */}
            <button
              className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 text-xs rounded hover:bg-red-700"
              onClick={() => handleDeleteRoom(room.id, room.roomNumber)}
            >
              Delete
            </button>

            <Link href={`/admin/rooms/${room.id}`}>
              <div className="font-bold text-lg cursor-pointer">{room.roomNumber}</div>
            </Link>
            <div className="text-sm mt-1">
              สถานะ:{" "}
              {room.status === "AVAILABLE"
                ? "ว่าง"
                : room.status === "OCCUPIED"
                ? "มีผู้เช่า"
                : "กำลังซ่อม"}
            </div>

            <select
              className="mt-2 text-black p-1 rounded"
              value={room.status}
              onChange={(e) =>
                handleStatusChange(room.id, e.target.value as RoomStatus)
              }
            >
              <option value="AVAILABLE">ว่าง</option>
              <option value="OCCUPIED">มีผู้เช่า</option>
              <option value="MAINTENANCE">กำลังซ่อม</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
