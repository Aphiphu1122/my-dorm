"use client";

import { useEffect, useState } from "react";

interface Profile {
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
  status?: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE"; // ถ้ามีส่งมาด้วย
}

type RoomStatus = "ALL" | "AVAILABLE" | "OCCUPIED" | "MAINTENANCE";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<RoomStatus>("ALL");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/admin/users", {
          credentials: "include",
        });
        const data = await res.json();
        if (res.ok) {
          setUsers(data.users);
        } else {
          console.error("โหลดข้อมูลไม่สำเร็จ:", data.error);
        }
      } catch (err) {
        console.error("เกิดข้อผิดพลาด:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = users.filter((user) => {
    const fullName = `${user.firstName} ${user.lastName} ${user.email}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === "ALL" ||
      (filterStatus === "OCCUPIED" && user.roomNumber) ||
      (filterStatus === "AVAILABLE" && !user.roomNumber);

    return matchesSearch && matchesStatus;
  });

  if (loading) return <p className="p-4">กำลังโหลด...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">📋 รายชื่อผู้เช่าทั้งหมด</h1>

      {/* ค้นหาและกรอง */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
        <input
          type="text"
          placeholder="🔍 ค้นหาชื่อ / อีเมล"
          className="border px-4 py-2 rounded w-full sm:w-1/2"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div>
          <label className="mr-2 font-semibold">Filter สถานะ:</label>
          <select
            className="border rounded px-2 py-1"
            value={filterStatus}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setFilterStatus(e.target.value as RoomStatus)
            }
          >
            <option value="ALL">✨ ทั้งหมด</option>
            <option value="AVAILABLE">ว่าง</option>
            <option value="OCCUPIED">มีผู้เช่า</option>
          </select>
        </div>
      </div>

      {/* ตาราง */}
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
            {filteredUsers.map((u) => (
              <tr key={u.id} className="hover:bg-gray-100">
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
    </div>
  );
}
