"use client";
 
import { useEffect, useState } from "react";
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
 
  const handleDeleteRoom = async (e: unknown, roomId: string, roomNumber: string) => {
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
    <div className="bg-white min-h-screen flex">
      <aside className="w-64 border-r border-gray-200 sticky top-0 h-screen">
          <Sidebar role="admin" />
       </aside>
 
      {/* ขวา: เอา max-w-5xl/mx-auto ออก ให้เต็มจอ */}
      <div className="flex-1 p-8 max-w-5xl mx-auto">
        <Toaster position="top-right" />
 
        {/* ===== Rooms Section ===== */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 px-4 md:px-6">
          <div>
                <h1 className="text-3xl font-bold text-[#0F3659]">Room Management</h1>
                <p className="text-gray-600">Manage rooms and status</p>
              </div>
          <div className="flex gap-2 w-full sm:w-auto">
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
 
        {loadingRooms ? (
          <p className="px-6">⏳ Loading rooms...</p>
        ) : (
          <div className="px-4 md:px-2 mb-10">
            <div className="grid [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))] gap-4">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className={`relative rounded-lg p-4 shadow-md transition-transform duration-300 cursor-pointer
                    hover:scale-105 hover:shadow-lg
                    ${
                      room.status === "OCCUPIED"
                        ? "bg-[#88D64C] text-white"
                        : room.status === "MAINTENANCE"
                        ? "bg-[#FFAE00] text-white"
                        : "bg-gray-200 text-gray-900"
                    }`}
                >
                  {/* Delete button */}
                  <button
                    onClick={(e) => handleDeleteRoom(e, room.id, room.roomNumber)}
                    className="absolute top-2 right-2 bg-black/20 hover: text-white rounded-full w-7 h-7 flex items-center justify-center text-lg font-bold transition"
                    aria-label={`Delete room ${room.roomNumber}`}
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
                    className="w-full text-gray-900 rounded-md px-2 py-2 mt-1 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
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
              ))}
            </div>
          </div>
        )}
 
        {/* ===== Users Section ===== */}
        <h2 className="text-3xl font-bold text-[#0F3659] mb-4 px-6">Tenant List</h2>
 
        {loadingUsers ? (
          <p className="px-6">⏳ Loading tenant data..</p>
        ) : (
          <div className="overflow-x-auto bg-gray-100 rounded-lg shadow-lg mx-4 md:mx-6">
            <table className="min-w-full table-auto text-sm text-left">
              <thead className="border border-gray-200 bg-white text-gray-600">
                <tr>
                  <th className="px-4 py-3">First Name</th>
                  <th className="px-4 py-3">Last Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">User ID</th>
                  <th className="px-4 py-3">Room</th>
                  <th className="px-4 py-3">Sign Up Date</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="border-gray-200 bg-white text-gray-800 hover:bg-gray-200 transition"
                  >
                    <td className="px-4 py-3">{u.firstName}</td>
                    <td className="px-4 py-3">{u.lastName}</td>
                    <td className="px-4 py-3">{u.email}</td>
                    <td className="px-4 py-3">{u.phone}</td>
                    <td className="px-4 py-3">{u.userId}</td>
                    <td className="px-4 py-3">{u.roomNumber || "-"}</td>
                    <td className="px-4 py-3">
                      {new Date(u.createdAt).toLocaleDateString("th-TH")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}