"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "react-hot-toast";
import Sidebar from "@/components/sidebar";

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
      if (!res.ok) throw new Error("โหลดข้อมูลบิลไม่สำเร็จ");
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
    <div className="flex min-h-screen bg-white text-black">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-200 sticky top-0 h-screen">
        <Sidebar role="admin" />
      </aside>

      {/* Main */}
      <main className="flex-1 p-8 max-w-6xl mx-auto">
        {/* Header Row */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#0F3659]">รายการบิลทั้งหมด</h1>
            <p className="text-gray-600 mt-1">จัดการบิลของผู้เช่าทั้งหมดในระบบ</p>
          </div>
          <Link href="/admin/bills/create">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition shadow">
              + สร้างบิลใหม่
            </button>
          </Link>
        </div>

        {/* Table / States */}
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 w-full bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : bills.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-500">
            ยังไม่มีรายการบิล
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="py-3 px-4">เดือน</th>
                  <th className="py-3 px-4">ห้อง</th>
                  <th className="py-3 px-4">ผู้เช่า</th>
                  <th className="py-3 px-4">รวมยอด</th>
                  <th className="py-3 px-4">สถานะ</th>
                  <th className="py-3 px-4 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((bill) => (
                  <tr key={bill.id} className="border-t hover:bg-gray-50">
                    <td className="py-3 px-4">
                      {format(new Date(bill.billingMonth), "MMMM yyyy")}
                    </td>
                    <td className="py-3 px-4">{bill.room?.roomNumber || "-"}</td>
                    <td className="py-3 px-4">
                      {bill.tenant?.firstName} {bill.tenant?.lastName}
                    </td>
                    <td className="py-3 px-4">{bill.totalAmount.toFixed(2)} บาท</td>
                    <td className="py-3 px-4">{getStatusLabel(bill.status)}</td>
                    <td className="py-3 px-4 text-center space-x-3">
                      <Link href={`/admin/bills/${bill.id}`}>
                        <button className="text-blue-600 hover:underline">
                          ดูรายละเอียด
                        </button>
                      </Link>

                      {/* ลบได้เฉพาะที่ยังไม่ชำระ */}
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
                              if (!res.ok) throw new Error("ลบบิลไม่สำเร็จ");
                              toast.success("ลบบิลสำเร็จ");
                              fetchBills();
                            } catch (err) {
                              toast.error("เกิดข้อผิดพลาดในการลบ");
                              console.error(err);
                            }
                          }}
                          className="text-red-600 hover:underline"
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
      </main>
    </div>
  );
}
