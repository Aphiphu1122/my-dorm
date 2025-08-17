"use client";

import { useEffect, useState } from "react";

type MoveOutStatus = "PENDING_APPROVAL" | "APPROVED" | "REJECTED";

type MoveOutRequest = {
  id: string;
  reason: string;
  note?: string;
  moveOutDate: string;
  status: MoveOutStatus;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
  };
  room: {
    roomNumber: string;
  };
};

export default function AdminMoveOutPage() {
  const [requests, setRequests] = useState<MoveOutRequest[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch("/api/admin/moveout");
      const data = await res.json();
      setRequests(data);
    };

    fetchData();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">คำร้องขอย้ายออก</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2">วันที่ยื่น</th>
              <th className="p-2">ชื่อผู้เช่า</th>
              <th className="p-2">เลขห้อง</th>
              <th className="p-2">วันที่ย้ายออก</th>
              <th className="p-2">เหตุผล</th>
              <th className="p-2">สถานะ</th>
              <th className="p-2">การจัดการ</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id} className="text-center border-t">
                <td className="p-2">{new Date(r.createdAt).toLocaleDateString()}</td>
                <td className="p-2">{r.user.firstName} {r.user.lastName}</td>
                <td className="p-2">{r.room.roomNumber}</td>
                <td className="p-2">{new Date(r.moveOutDate).toLocaleDateString()}</td>
                <td className="p-2">{r.reason}</td>
                <td className="p-2">
                  {r.status === "PENDING_APPROVAL" && <span className="text-yellow-500">รออนุมัติ ⏳</span>}
                  {r.status === "APPROVED" && <span className="text-green-600">อนุมัติแล้ว ✅</span>}
                  {r.status === "REJECTED" && <span className="text-red-500">ถูกปฏิเสธ ❌</span>}
                </td>
                <td className="p-2">
                  {/* ลิงก์ไปหน้า /admin/moveout/[id] หรือ popup สำหรับอนุมัติ/ปฏิเสธ */}
                  <a
                    href={`/admin/moveout/${r.id}`}
                    className="text-blue-500 underline"
                  >
                    จัดการ
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
