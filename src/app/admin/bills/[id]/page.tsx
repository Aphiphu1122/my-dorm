"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

type Bill = {
  id: string;
  billingMonth: string;
  rentAmount: number;
  waterUnit: number;
  waterRate: number;
  electricUnit: number;
  electricRate: number;
  totalAmount: number;
  status: "PAID" | "UNPAID";
  paymentDate?: string | null;
  tenant: {
    firstName: string;
    lastName: string;
  };
  room: {
    roomNumber: string;
  };
};

export default function AdminBillDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);

  const billId = params.id as string;

  useEffect(() => {
    fetch(`/api/admin/bills/${billId}`)
      .then((res) => res.json())
      .then(setBill)
      .finally(() => setLoading(false));
  }, [billId]);

  const handleMarkPaid = async () => {
    const res = await fetch(`/api/admin/bills/${billId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "PAID" }),
    });

    if (res.ok) {
      toast.success("อัปเดตสถานะเป็น ชำระแล้ว");
      router.refresh();
    } else {
      toast.error("ไม่สามารถอัปเดตสถานะได้");
    }
  };

  if (loading) return <p className="p-4">กำลังโหลดข้อมูล...</p>;
  if (!bill) return <p className="p-4">ไม่พบบิลนี้</p>;

  return (
    <div className="max-w-xl mx-auto mt-8 p-6 border rounded">
      <h1 className="text-2xl font-bold mb-4">รายละเอียดบิล</h1>
      <p><strong>ผู้เช่า:</strong> {bill.tenant.firstName} {bill.tenant.lastName}</p>
      <p><strong>ห้อง:</strong> {bill.room.roomNumber}</p>
      <p><strong>เดือน:</strong> {new Date(bill.billingMonth).toLocaleDateString("th-TH", { year: "numeric", month: "long" })}</p>
      <p><strong>ค่าเช่า:</strong> {bill.rentAmount} บาท</p>
      <p><strong>ค่าน้ำ:</strong> {bill.waterUnit} หน่วย x {bill.waterRate} = {bill.waterUnit * bill.waterRate} บาท</p>
      <p><strong>ค่าไฟ:</strong> {bill.electricUnit} หน่วย x {bill.electricRate} = {bill.electricUnit * bill.electricRate} บาท</p>
      <p className="mt-2 text-lg"><strong>ยอดรวม:</strong> {bill.totalAmount.toLocaleString()} บาท</p>
      <p><strong>สถานะ:</strong> {bill.status === "PAID" ? "🟢 ชำระแล้ว" : "🔴 ค้างชำระ"}</p>
      {bill.paymentDate && (
        <p><strong>วันที่ชำระ:</strong> {new Date(bill.paymentDate).toLocaleDateString("th-TH")}</p>
      )}

      {bill.status === "UNPAID" && (
        <button
          onClick={handleMarkPaid}
          className="mt-4 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
        >
          ✅ อัปเดตสถานะเป็นชำระแล้ว
        </button>
      )}
    </div>
  );
}
