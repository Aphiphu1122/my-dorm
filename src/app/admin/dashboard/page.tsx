// src/app/admin/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";

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

type Profile = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthday: string;
  address: string;
  nationalId: string;
  userId: string;
  createdAt: string;
  roomNumber: string;
};

export default function AdminDashboardPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [newRoomNumber, setNewRoomNumber] = useState("");

  useEffect(() => {
    fetchRooms();
    fetchUsers();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoadingRooms(true);
      const res = await fetch("/api/admin/rooms", { credentials: "include" });
      const data = await res.json();
      setRooms(Array.isArray(data.rooms) ? data.rooms : []);
    } catch (err) {
      console.error("❌ โหลดข้อมูลห้องล้มเหลว:", err);
      toast.error("โหลดข้อมูลห้องล้มเหลว");
      console.error("❌ โหลดข้อมูลห้องล้มเหลว:", err);
    } finally {
      setLoadingRooms(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await fetch("/api/admin/users", {
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error("โหลดผู้ใช้ล้มเหลว", err);
    } finally {
      setLoadingUsers(false);
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
    const confirmDelete = confirm(`คุณต้องการลบห้อง ${roomNumber} หรือไม่?`);
    if (!confirmDelete) return;

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

  return (
    <div className="p-6">
      <Toaster position="top-right" />

      {/* ===== Rooms Section ===== */}
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

      {loadingRooms ? (
        <p>กำลังโหลดห้อง...</p>
      ) : (
        <div className="grid grid-cols-5 gap-4 mb-10">
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
      )}

      {/* ===== Users Section ===== */}
      <h2 className="text-2xl font-bold mb-4">รายชื่อผู้เช่าทั้งหมด</h2>

      {loadingUsers ? (
        <p>กำลังโหลดรายชื่อผู้เช่า...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border text-sm">
            <thead>
              <tr className="bg-gray-700 text-left text-white">
                <th className="border p-2">ชื่อ</th>
                <th className="border p-2">นามสกุล</th>
                <th className="border p-2">อีเมล</th>
                <th className="border p-2">เบอร์โทร</th>
                <th className="border p-2">userID</th>
                <th className="border p-2">ห้องพัก</th>
                <th className="border p-2">วันที่สมัคร</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="border p-2">{u.firstName}</td>
                  <td className="border p-2">{u.lastName}</td>
                  <td className="border p-2">{u.email}</td>
                  <td className="border p-2">{u.phone}</td>
                  <td className="border p-2">{u.userId}</td>
                  <td className="border p-2">{u.roomNumber || "-"}</td>
                  <td className="border p-2">
                    {new Date(u.createdAt).toLocaleDateString("th-TH")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
