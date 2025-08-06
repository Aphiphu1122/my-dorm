"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "react-hot-toast";

type BillStatus = "UNPAID" | "PENDING_APPROVAL" | "PAID";

type Bill = {
  id: string;
  billingMonth: string;
  rentAmount: number;
  waterUnit: number;
  waterRate: number;
  electricUnit: number;
  electricRate: number;
  totalAmount: number;
  status: BillStatus;
  createdAt: string;
  room: {
    roomNumber: string;
  };
  tenant: {
    firstName: string;
    lastName: string;
  };
};

export default function AdminBillListPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      const res = await fetch("/api/admin/bills");
      if (!res.ok) {
        throw new Error("โหลดข้อมูลบิลไม่สำเร็จ");
      }
      const data = await res.json();
      setBills(data);
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการโหลดบิล"
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status: BillStatus) => {
    switch (status) {
      case "PAID":
        return <span className="text-green-600 font-semibold">✅ ชำระแล้ว</span>;
      case "PENDING_APPROVAL":
        return <span className="text-yellow-600 font-semibold">🕒 รอตรวจสอบ</span>;
      case "UNPAID":
      default:
        return <span className="text-red-600 font-semibold">❌ ยังไม่ชำระ</span>;
    }
  };

    return (
  <div className="p-6">
    <div className="flex items-center justify-between mb-4">
      <h1 className="text-2xl font-bold">รายการบิลทั้งหมด</h1>
      <Link href="/admin/bills/create">
        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          + สร้างบิลใหม่
        </button>
      </Link>
    </div>

    {loading ? (
      <p>กำลังโหลด...</p>
    ) : bills.length === 0 ? (
      <p>ยังไม่มีรายการบิล</p>
    ) : (
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="py-2 px-4 border-b">เดือน</th>
              <th className="py-2 px-4 border-b">ห้อง</th>
              <th className="py-2 px-4 border-b">ผู้เช่า</th>
              <th className="py-2 px-4 border-b">รวมยอด</th>
              <th className="py-2 px-4 border-b">สถานะ</th>
              <th className="py-2 px-4 border-b text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {bills.map((bill) => (
              <tr key={bill.id}>
                <td className="py-2 px-4 border-b">
                  {format(new Date(bill.billingMonth), "MMMM yyyy")}
                </td>
                <td className="py-2 px-4 border-b">{bill.room?.roomNumber || "-"}</td>
                <td className="py-2 px-4 border-b">
                  {bill.tenant?.firstName} {bill.tenant?.lastName}
                </td>
                <td className="py-2 px-4 border-b">
                  {bill.totalAmount.toFixed(2)} บาท
                </td>
                <td className="py-2 px-4 border-b">{getStatusLabel(bill.status)}</td>
                <td className="py-2 px-4 border-b text-center space-x-2">
                  <Link href={`/admin/bills/${bill.id}`}>
                    <button className="text-blue-500 hover:underline">ดูรายละเอียด</button>
                  </Link>

                  {/* ✅ แสดงปุ่มลบเฉพาะเมื่อสถานะไม่ใช่ PAID */}
                  {bill.status !== "PAID" && (
                    <button
                      onClick={async () => {
                        const confirmed = window.confirm(
                          "คุณแน่ใจหรือไม่ว่าต้องการลบบิลนี้?"
                        );
                        if (!confirmed) return;

                        try {
                          const res = await fetch(`/api/admin/bills/${bill.id}`, {
                            method: "DELETE",
                          });

                          if (!res.ok) {
                            throw new Error("ลบบิลไม่สำเร็จ");
                          }

                          toast.success("ลบบิลสำเร็จ");
                          fetchBills(); // reload list
                        } catch (err) {
                          toast.error("เกิดข้อผิดพลาดในการลบ");
                          console.error(err);
                        }
                      }}
                      className="text-red-500 hover:underline"
                    >
                      ลบบิล
                    </button>
                  )}
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