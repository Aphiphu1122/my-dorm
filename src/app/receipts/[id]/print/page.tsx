"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Bill = {
  id: string;
  status: string;
  createdAt: string;
  rentAmount: number;
  waterUnit: number;
  waterRate: number;
  electricUnit: number;
  electricRate: number;
  totalAmount: number;
  transactionRef?: string;
  paymentDate?: string;
  tenant: {
    firstName: string;
    lastName: string;
  };
  room: {
    roomNumber: string;
  };
};

export default function ReceiptPrintPage() {
  const { id } = useParams();
  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBill = async () => {
      try {
        const res = await fetch(`/api/admin/bills/${id}`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch bill");
        const data = await res.json();
        setBill(data.bill);
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchBill();
  }, [id]);

  useEffect(() => {
    if (!loading && bill) {
      setTimeout(() => window.print(), 300);
    }
  }, [loading, bill]);

  if (loading) return <p className="text-center mt-6">กำลังโหลด...</p>;
  if (!bill) return <p className="text-center mt-6">ไม่พบข้อมูลบิล</p>;

  const waterTotal = bill.waterUnit * bill.waterRate;
  const electricTotal = bill.electricUnit * bill.electricRate;

  return (
  <div className="max-w-xl mx-auto bg-white p-6 text-black rounded shadow print:p-0 print:shadow-none print:bg-white print:max-w-full print:rounded-none print:text-black">
    <div className="flex justify-end mb-4 print:hidden">
      <button
        onClick={() => window.print()}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        🖨️ พิมพ์ใบเสร็จ
      </button>
    </div>

    <div className="text-center mb-6">
      <h2 className="text-xl font-bold">ใบเสร็จการชำระเงิน</h2>
      <p className="text-sm text-gray-700">รหัสบิล: {bill.id}</p>
      <p className="text-sm text-gray-700">
        วันที่ชำระ:{" "}
        {bill.paymentDate
          ? new Date(bill.paymentDate).toLocaleString("th-TH")
          : "-"}
      </p>
    </div>

    <div className="space-y-2 text-sm">
      <p>👤 ผู้เช่า: {bill.tenant.firstName} {bill.tenant.lastName}</p>
      <p>🏠 ห้องพัก: {bill.room.roomNumber}</p>
      <p>💧 ค่าน้ำ: {bill.waterUnit} x {bill.waterRate} = {waterTotal.toLocaleString()} บาท</p>
      <p>⚡ ค่าไฟ: {bill.electricUnit} x {bill.electricRate} = {electricTotal.toLocaleString()} บาท</p>
      <p>💵 ค่าเช่า: {bill.rentAmount.toLocaleString()} บาท</p>
      <hr className="my-2" />
      <p className="font-bold text-lg">💰 รวมทั้งหมด: {bill.totalAmount.toLocaleString()} บาท</p>

      {bill.transactionRef && (
        <p>🔖 รหัสธุรกรรม: {bill.transactionRef}</p>
      )}
    </div>

    <p className="mt-6 text-xs text-gray-500 print:mt-8">
      * เอกสารนี้ใช้สำหรับเป็นหลักฐานการชำระเงินเท่านั้น
    </p>
  </div>
 ); 
} 