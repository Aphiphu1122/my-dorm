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

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar role="admin" />

      <main className="flex-1 p-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tenant List</h1>
            <h2 className=" text-gray-400 mt-2">
              Manage all tenants registered in the system
            </h2>
          </div>
        </div>

        {/* Filter and Search */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-6">
          <div className="relative w-full sm:w-2/3">
            <i className="ri-search-2-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"></i>
            <input
              type="text"
              placeholder="Search name / email"
              className="border border-gray-400 px-4 py-2 pl-12 rounded-md shadow-sm w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 sm:ml-auto">
            <label className="font-medium text-gray-700">Filter status:</label>
            <select
              className="border border-gray-400 rounded-md px-3 py-2 shadow-sm"
              value={filterStatus}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setFilterStatus(e.target.value as RoomStatus)
              }
            >
              <option value="ALL">All</option>
              <option value="AVAILABLE">Available</option>
              <option value="OCCUPIED">Occupied</option>
            </select>
          </div>
        </div>


        {/* Content */}
        {loading ? (
          <p className="text-gray-600">⏳ Loading tenant data...</p>
        ) : (
          <div className="overflow-x-auto bg-gray-100 rounded-lg shadow-lg">
            <table className="min-w-full table-auto text-sm text-left">
              <thead className="border border-gray-200 bg-white  text-gray-600">
                <tr>
                  <th className="px-4 py-3">First Name</th>
                  <th className="px-4 py-3">Last Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">User ID</th>
                  <th className="px-4 py-3">Room </th>
                  <th className="px-4 py-3">Sign Up Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr
                    key={u.id}
                    className="border-gray-200 bg-white text-gray-800 hover:bg-gray-200 transition"
                  >
                    <td className="px-4 py-3">{u.firstName}</td>
                    <td className="px-4 py-3">{u.lastName}</td>
                    <td className="px-4 py-3">{u.email}</td>
                    <td className="px-4 py-3">{u.phone}</td>
                    <td className="px-4 py-3">{u.userId}</td>
                    <td className="px-4 py-3">
                      {u.roomNumber ? u.roomNumber : "-"}
                    </td>
                    <td className="px-4 py-3">
                      {new Date(u.createdAt).toLocaleDateString("th-TH")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
