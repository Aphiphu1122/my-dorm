"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'react-hot-toast';

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
  paymentSlipUrl?: string;
  paymentDate?: string;
  transactionRef?: string;
  tenant: {
    firstName: string;
    lastName: string;
  };
  room: {
    roomNumber: string;
  };
};

export default function AdminBillDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!id || typeof id !== 'string') return;

    const fetchBill = async () => {
      try {
        const res = await fetch(`/api/admin/bills/${id}`, {
          method: 'GET',
          credentials: 'include',
        });

        if (!res.ok) throw new Error('โหลดข้อมูลไม่สำเร็จ');
        const data = await res.json();
        setBill(data.bill);
      } catch (err) {
        console.error('Fetch bill error:', err);
        toast.error('ไม่พบข้อมูลบิล');
        router.push('/admin/bills');
      } finally {
        setLoading(false);
      }
    };

    fetchBill();
  }, [id, router]);

  const handleApprovePayment = async () => {
    if (!id || typeof id !== 'string') return;

    try {
      setUpdating(true);

      const res = await fetch(`/api/admin/bills/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'PAID' }),
      });

      if (!res.ok) throw new Error();
      toast.success('✅ อนุมัติการชำระเงินแล้ว');
      router.refresh();
    } catch {
      toast.error('❌ อัปเดตสถานะไม่สำเร็จ');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <p className="text-center mt-8">กำลังโหลด...</p>;
  if (!bill) return <p className="text-center mt-8">ไม่พบข้อมูลบิล</p>;

  const waterTotal = bill.waterUnit * bill.waterRate;
  const electricTotal = bill.electricUnit * bill.electricRate;

  const statusLabel = {
    UNPAID: "❌ ค้างชำระ",
    PENDING_APPROVAL: "⏳ รอตรวจสอบ",
    PAID: "✅ ชำระแล้ว",
  };

 return (
    <div className="max-w-3xl mx-auto mt-8 p-6 bg-white text-black rounded shadow">
      <h1 className="text-2xl font-bold mb-4">รายละเอียดบิล</h1>

      <div className="space-y-2">
        <p>👤 ผู้เช่า: {bill.tenant.firstName} {bill.tenant.lastName}</p>
        <p>🏠 ห้องพัก: {bill.room.roomNumber}</p>
        <p>🗓 เดือน: {new Date(bill.billingMonth).toLocaleDateString("th-TH", { year: "numeric", month: "long" })}</p>
        <p>💧 น้ำ: {bill.waterUnit} หน่วย x {bill.waterRate} บาท = {waterTotal.toLocaleString()} บาท</p>
        <p>⚡ ไฟฟ้า: {bill.electricUnit} หน่วย x {bill.electricRate} บาท = {electricTotal.toLocaleString()} บาท</p>
        <p>💵 ค่าเช่า: {bill.rentAmount.toLocaleString()} บาท</p>
        <p className="font-bold">💰 รวมทั้งหมด: {bill.totalAmount.toLocaleString()} บาท</p>
        <p>📌 สถานะปัจจุบัน: {statusLabel[bill.status]}</p>
      </div>

      {bill.status === "PENDING_APPROVAL" && (
        <div className="mt-6">
          <button
            onClick={handleApprovePayment}
            disabled={updating}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {updating ? "กำลังอนุมัติ..." : "✅ อนุมัติการชำระเงิน"}
          </button>
        </div>
      )}

      {bill.paymentSlipUrl && (
        <div className="mt-8 border-t pt-6">
          <h2 className="text-lg font-semibold mb-3 text-blue-700">🧾 ข้อมูลการชำระเงิน</h2>

          <div className="mb-2">
            <span className="font-medium">เลขอ้างอิง (Transaction Ref): </span>
            <span>{bill.transactionRef}</span>
          </div>

          <div className="mb-4">
            <span className="font-medium">วันที่โอนเงิน: </span>
            <span>{bill.paymentDate ? new Date(bill.paymentDate).toLocaleString("th-TH") : "-"}</span>
          </div>

          <Image
            src={bill.paymentSlipUrl}
            alt="สลิปโอน"
            width={500}
            height={300}
            className="rounded border"
            unoptimized
          />
        </div>
      )}
    </div>
  );
}
