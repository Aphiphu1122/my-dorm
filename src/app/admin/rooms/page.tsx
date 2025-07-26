"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Room = {
  id: string;
  roomNumber: string;
  tenant?: {
    firstName: string;
    lastName: string;
    email: string;
  };
};

export default function RoomManagementPage() {
  const [rooms, setRooms] = useState<Room[]>([]);

  useEffect(() => {
  const fetchRooms = async () => {
    const res = await fetch("/api/admin/rooms", {
      credentials: "include",
    });
    const data = await res.json();
    setRooms(data); // ✅ เพราะ API ส่งมาแบบ array ตรงๆ
  };
  fetchRooms();
}, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">All Rooms</h1>
        <button className="bg-blue-900 text-white px-4 py-2 rounded">➕ เพิ่มห้อง</button>
      </div>

      <div className="grid grid-cols-5 gap-4">
        {rooms.map((room) => (
          <Link key={room.id} href={`/admin/rooms/${room.id}`}>
            <div
              className={`rounded p-4 text-center cursor-pointer ${
                room.tenant ? "bg-green-400 text-white" : "bg-gray-300 text-gray-800"
              }`}
            >
              <div className="font-bold">{room.roomNumber}</div>
              <div className="text-sm">
                {room.tenant ? "Have Tenant" : "ว่าง"}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
