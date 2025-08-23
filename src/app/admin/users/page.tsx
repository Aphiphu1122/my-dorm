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
    <div className="flex min-h-screen">
      {/* Sidebar*/}
      <aside className="w-64 border-r border-gray-200 sticky top-0 h-screen">
        <Sidebar role="admin" />
      </aside>
 
      {/* Main content*/}
      <main className="flex-1 p-8 max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#0F3659]">Tenant Management</h1>
            <p className="text-gray-600 mt-1">List of tenants and occupancy status</p>
          </div>
 
          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Search input */}
            <div className="flex items-center border border-gray-300 rounded w-full sm:w-auto overflow-hidden">
              <span className="flex items-center px-2 text-gray-500">
                <i className="ri-search-line text-xl"></i>
              </span>
              <input
                type="text"
                placeholder="Search name or email"
                className="flex-1 px-2 py-2 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
 
            {/* Filter */}
            <div className="flex items-center gap-2">
              <label className="font-semibold text-gray-700">Filter:</label>
              <select
                className="border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#0F3659]"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as RoomStatus)}
              >
                <option value="ALL">All</option>
                <option value="AVAILABLE">Available</option>
                <option value="OCCUPIED">Occupied</option>
              </select>
            </div>
          </div>
        </div>
 
        {/* ตารางข้อมูล */}
        <div className="overflow-x-auto bg-white rounded-xl border border-gray-200 mt-5 shadow-sm">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="px-4 py-3">First name</th>
                <th className="px-4 py-3">Last name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone number</th>
                <th className="px-4 py-3">User ID</th>
                <th className="px-4 py-3">Room number</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
 
            <tbody>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-t ">
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
                : filteredUsers.length > 0
                ? filteredUsers.map((u) => (
                    <tr key={u.id} className="border-t border-gray-200 hover:bg-gray-200 transition-colors">
                      <td className="px-4 py-3  ">{u.firstName}</td>
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
                : (
                  <tr>
                    <td
                      className="px-4 py-8 text-center text-gray-500"
                      colSpan={7}
                    >
                      No information found according to the search conditions.
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