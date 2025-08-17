"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/sidebar";

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
  status?: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE";
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
        const res = await fetch("/api/admin/users", { credentials: "include" });
        const data = await res.json();
        if (res.ok) {
          setUsers(data.users || []);
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
    const fullText = `${user.firstName} ${user.lastName} ${user.email}`.toLowerCase();
    const matchesSearch = fullText.includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === "ALL" ||
      (filterStatus === "OCCUPIED" && !!user.roomNumber) ||
      (filterStatus === "AVAILABLE" && !user.roomNumber);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex min-h-screen bg-white text-black">
      {/* Sidebar (ซ้าย) */}
      <aside className="w-64 border-r border-gray-200 sticky top-0 h-screen">
        <Sidebar role="admin" />
      </aside>

      {/* Main content (ขวา) */}
      <main className="flex-1 p-8 max-w-6xl mx-auto">
        {/* หัวข้อหน้า */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#0F3659]">Tenant Management</h1>
            <p className="text-gray-600 mt-1">รายชื่อผู้เช่าและสถานะการเข้าพัก</p>
          </div>
        </div>

        {/* แถบค้นหา + กรอง */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <div className="relative w-full sm:w-1/2">
            <input
              type="text"
              placeholder="🔍 ค้นหาชื่อ / อีเมล"
              className="w-full border border-gray-300 px-4 py-2 rounded-md pr-10 focus:outline-none focus:ring-2 focus:ring-[#0F3659]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <i className="ri-search-line absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
          </div>

          <div className="flex items-center gap-2">
            <label className="font-semibold text-gray-700">Filter:</label>
            <select
              className="border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#0F3659]"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as RoomStatus)}
            >
              <option value="ALL">✨ ทั้งหมด</option>
              <option value="AVAILABLE">ว่าง</option>
              <option value="OCCUPIED">มีผู้เช่า</option>
            </select>
          </div>
        </div>

        {/* ตารางข้อมูล */}
        <div className="overflow-x-auto bg-white rounded-xl border border-gray-200 shadow-sm">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="px-4 py-3">ชื่อ</th>
                <th className="px-4 py-3">นามสกุล</th>
                <th className="px-4 py-3">อีเมล</th>
                <th className="px-4 py-3">เบอร์โทร</th>
                <th className="px-4 py-3">User ID</th>
                <th className="px-4 py-3">ห้องพัก</th>
                <th className="px-4 py-3">วันที่สมัคร</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                // สkeleton แสดงระหว่างโหลด
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-4 py-3">
                      <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-3 w-28 bg-gray-200 rounded animate-pulse" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-3 w-40 bg-gray-200 rounded animate-pulse" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-3 w-28 bg-gray-200 rounded animate-pulse" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-3 w-10 bg-gray-200 rounded animate-pulse" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="border-t hover:bg-gray-50">
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
                ))
              ) : (
                <tr>
                  <td className="px-4 py-8 text-center text-gray-500" colSpan={7}>
                    ไม่พบข้อมูลตามเงื่อนไขที่ค้นหา
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
