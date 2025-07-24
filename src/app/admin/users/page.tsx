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
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      setUsers(data.users);
      setLoading(false);
    };

    fetchUsers();
  }, []);

  if (loading) return <p>กำลังโหลด...</p>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">รายชื่อผู้ใช้</h1>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">ชื่อ</th>
            <th className="border p-2">นามสกุล</th>
            <th className="border p-2">อีเมล</th>
            <th className="border p-2">เบอร์โทร</th>
            <th className="border p-2">รหัสผู้ใช้</th>
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
              <td className="border p-2">{new Date(u.createdAt).toLocaleDateString("th-TH")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
