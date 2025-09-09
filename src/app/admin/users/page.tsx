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
  roomNumber: string | null;      // ✅ อาจเป็น null
  roomStartDate?: string | null;  // ✅ อาจเป็น null
  assignedAt?: string | null;     // ✅ อาจเป็น null
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
          const list: Profile[] = Array.isArray(data?.users) ? data.users : [];
          setUsers(list);
        } else {
          console.error("โหลดข้อมูลไม่สำเร็จ:", data?.error ?? res.statusText);
          setUsers([]);
        }
      } catch (err) {
        console.error("เกิดข้อผิดพลาด:", err);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const toThaiDate = (iso?: string | null) => {
    if (!iso) return "-";
    const t = new Date(iso);
    return isNaN(t.getTime())
      ? "-"
      : t.toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });
  };

  const filteredUsers = users.filter((user) => {
    const fullText = `${user.firstName ?? ""} ${user.lastName ?? ""} ${user.email ?? ""}`.toLowerCase();
    const matchesSearch = fullText.includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === "ALL" ||
      (filterStatus === "OCCUPIED" && !!user.roomNumber) ||
      (filterStatus === "AVAILABLE" && !user.roomNumber) ||
      (filterStatus === "MAINTENANCE" && user.status === "MAINTENANCE");

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex min-h-screen bg-white">
      <aside className="w-64 border-r border-gray-200 sticky top-0 h-screen">
        <Sidebar role="admin" />
      </aside>

      <main className="flex-1 p-8 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#0F3659]">Tenant Management</h1>
            <p className="text-gray-600 mt-1">List of tenants and occupancy status</p>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center border border-gray-300 rounded w-full sm:w-auto overflow-hidden">
              <span className="flex items-center px-2 text-gray-500">
                <i className="ri-search-line text-xl" />
              </span>
              <input
                type="text"
                placeholder="Search name or email"
                className="flex-1 px-2 py-2 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="font-semibold text-gray-700">Filter:</label>
              <select
                className="border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as RoomStatus)}
              >
                <option value="ALL">All</option>
                <option value="AVAILABLE">Available</option>
                <option value="OCCUPIED">Occupied</option>
                <option value="MAINTENANCE">Maintenance</option>
              </select>
            </div>
          </div>
        </div>

        {/* Card Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="p-4 bg-white rounded-xl shadow animate-pulse h-40" />
              ))
            : filteredUsers.map((user) => {
                const initials =
                  `${(user.firstName ?? "").charAt(0)}${(user.lastName ?? "").charAt(0)}`.toUpperCase() || "?";
                const badgeClass = user.roomNumber
                  ? "bg-green-100 text-green-600"
                  : "bg-red-100 text-red-600";

                return (
                  <div
                    key={user.id}
                    className="bg-white rounded-xl shadow p-4 flex flex-col justify-between hover:shadow-lg transition duration-200 transform hover:scale-105"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold">
                          {initials}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {user.firstName} {user.lastName}
                          </h3>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${badgeClass}`}>
                        {user.roomNumber ? "Occupied" : "Available"}
                      </span>
                    </div>

                    {/* Footer Info */}
                    <div className="flex flex-col text-gray-700 text-sm gap-2">
                      <div className="flex items-center gap-2">
                        <i className="ri-phone-fill text-gray-500" />
                        <span>{user.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <i className="ri-user-fill text-gray-500" />
                        <span>{user.userId}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <i className="ri-home-4-fill text-gray-500" />
                        <span>{user.roomNumber ?? "-"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <i className="ri-calendar-fill text-gray-500" />
                        <span>
                          {toThaiDate(user.roomStartDate) !== "-"
                            ? toThaiDate(user.roomStartDate)
                            : toThaiDate(user.assignedAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
        </div>
      </main>
    </div>
  );
}
