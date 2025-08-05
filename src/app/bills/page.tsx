"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type BillStatus = "UNPAID" | "PENDING_APPROVAL" | "PAID";

type Bill = {
  id: string;
  billingMonth: string;
  totalAmount: number;
  status: BillStatus;
};

export default function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBills = async () => {
      const res = await fetch("/api/bills");
      const data = await res.json();
      setBills(data.bills);
      setLoading(false);
    };

    fetchBills();
  }, []);

  const renderStatus = (status: BillStatus) => {
    switch (status) {
      case "PAID":
        return <span className="text-green-600">✅ ชำระแล้ว</span>;
      case "PENDING_APPROVAL":
        return <span className="text-yellow-600">⏳ รอตรวจสอบ</span>;
      case "UNPAID":
      default:
        return <span className="text-red-600">❌ ค้างชำระ</span>;
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-8">
      <h1 className="text-2xl font-bold mb-4">รายการบิลของคุณ</h1>

      {loading ? (
        <p>กำลังโหลด...</p>
      ) : bills.length === 0 ? (
        <p>ยังไม่มีรายการบิล</p>
      ) : (
        <div className="space-y-4">
          {bills.map((bill) => (
            <div key={bill.id} className="border p-4 rounded shadow-sm flex justify-between items-center">
              <div>
                <p className="font-semibold">
                  เดือน: {new Date(bill.billingMonth).toLocaleDateString("th-TH", { year: "numeric", month: "long" })}
                </p>
                <p>ยอดรวม: {bill.totalAmount.toFixed(2)} บาท</p>
                <p>สถานะ: {renderStatus(bill.status)}</p>
              </div>
              <Link
                href={`/bills/${bill.id}`}
                className="text-blue-600 underline hover:text-blue-800"
              >
                ดูรายละเอียด
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
