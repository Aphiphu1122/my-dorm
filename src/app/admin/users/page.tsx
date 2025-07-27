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
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <p className="p-4">กำลังโหลด...</p>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">รายชื่อผู้เช่าทั้งหมด</h1>
      <div className="overflow-x-auto">
        <table className="w-full border text-sm">
                  <thead>
          <tr className="bg-gray-700 text-left">
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
    </div>
  );
}
