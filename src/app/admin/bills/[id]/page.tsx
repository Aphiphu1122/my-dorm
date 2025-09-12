"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import Sidebar from "@/components/sidebar";

type BillStatus = "UNPAID" | "PENDING_APPROVAL" | "PAID";

type Bill = {
  id: string;
  billingMonth: string;
  rentAmount: number;

  waterPrev: number;
  waterCurr: number;
  waterUnit: number;
  waterRate: number;

  electricPrev: number;
  electricCurr: number;
  electricUnit: number;
  electricRate: number;

  totalAmount: number;
  status: BillStatus;
  paymentSlipUrl?: string;
  paymentDate?: string;
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

  if (loading)
    return (
      <p className="text-center mt-8 text-gray-600 dark:text-gray-300">
        กำลังโหลด...
      </p>
    );
  if (!bill)
    return (
      <p className="text-center mt-8 text-red-600 dark:text-red-400">
        ไม่พบข้อมูลบิล
      </p>
    );

  const waterTotal = bill.waterUnit * bill.waterRate;
  const electricTotal = bill.electricUnit * bill.electricRate;

  const statusLabel = {
    UNPAID: "ยังไม่ชำระ",
    PENDING_APPROVAL: "รออนุมัติ",
    PAID: "ชำระแล้ว",
  };

  return (
    <div className="bg-white min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-200 sticky top-0 h-screen">
        <Sidebar role="admin" />
      </aside>

      {/* Content */}
      <main className="flex-1 p-8 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-black dark:text-gray-900 mb-2">
          จัดการบิล & การชำระเงิน
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          จัดการบิลค่าเช่าและการชำระเงินของผู้เช่า
        </p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-blue-950 mb-3">
            บิลค่าเช่า{" "}
            {new Date(bill.billingMonth).toLocaleDateString("th-TH", {
              month: "long",
              year: "numeric",
            })}
          </h2>

          <div className="rounded-lg shadow p-4 flex justify-between items-center cursor-pointer border-gray-200 dark:border-gray-700">
            <span className="text-gray-600 font-medium">สถานะบิล</span>
            <span
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-semibold text-sm ${
                bill.status === "PAID"
                  ? "bg-green-100 text-green-700"
                  : bill.status === "PENDING_APPROVAL"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {statusLabel[bill.status]}
              {bill.status === "PAID" && (
                <i className="ri-checkbox-circle-fill text-green-600"></i>
              )}
            </span>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-blue-950 mb-4">
            รายการในบิล
          </h2>

          <div className="rounded-lg shadow border border-gray-200">
            <div className="grid grid-cols-2 px-6 py-4 border-b border-gray-200">
              <span className="text-gray-700">ค่าเช่าห้อง</span>
              <span className="text-right text-gray-900">
                {bill.rentAmount.toLocaleString()} บาท
              </span>
            </div>

            {/*  Water Meter */}
            <div className="grid grid-cols-2 px-6 py-4 border-b border-gray-200">
              <span className="text-gray-700">
                ค่าน้ำ (ครั้งก่อน {bill.waterPrev} → ครั้งนี้ {bill.waterCurr})
              </span>
              <span className="text-right text-gray-900">
                {bill.waterUnit} หน่วย × {bill.waterRate} ={" "}
                {waterTotal.toLocaleString()} บาท
              </span>
            </div>

            {/*  Electric Meter */}
            <div className="grid grid-cols-2 px-6 py-4 border-b border-gray-200">
              <span className="text-gray-700">
                ค่าไฟ (ครั้งก่อน {bill.electricPrev} → ครั้งนี้ {bill.electricCurr})
              </span>
              <span className="text-right text-gray-900">
                {bill.electricUnit} หน่วย × {bill.electricRate} ={" "}
                {electricTotal.toLocaleString()} บาท
              </span>
            </div>

            <div className="grid grid-cols-2 px-6 py-4 font-semibold text-orange-600">
              <span>รวมทั้งหมด</span>
              <span className="text-right">
                {bill.totalAmount.toLocaleString()} บาท
              </span>
            </div>
          </div>

          {bill.status === "UNPAID" && (
            <div className="mt-6">
              <a
                href="http://localhost:3000/admin/bills"
                className="inline-block px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition duration-200 transform hover:scale-105"
              >
                กลับไปหน้ารายการบิลทั้งหมด
              </a>
            </div>
          )}
        </section>

        {bill.status === "PENDING_APPROVAL" && (
          <div className="mt-6">
            <button
              onClick={handleApprovePayment}
              disabled={updating}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {updating ? "กำลังอนุมัติ..." : "อนุมัติการชำระเงิน"}
            </button>
          </div>
        )}

        {bill.paymentSlipUrl && (
          <section className="mt-5 pt-6">
            <h2 className="text-lg font-semibold mb-4 text-blue-950">
              ข้อมูลการชำระเงิน
            </h2>

            <div className="rounded-lg shadow border border-gray-200">
              <div className="grid grid-cols-2 px-6 py-4 border-b border-gray-200">
                <span className="font-medium text-gray-700">วันที่ชำระ</span>
                <span className="text-right text-gray-900">
                  {bill.paymentDate
                    ? new Date(bill.paymentDate).toLocaleString("th-TH")
                    : "-"}
                </span>
              </div>

              <div className="grid grid-cols-2 px-6 py-4 border-b border-gray-200">
                <p className="font-medium text-gray-700 mb-2">สลิปการชำระเงิน</p>
                <Image
                  src={bill.paymentSlipUrl}
                  alt="Payment Slip"
                  width={200}
                  height={120}
                  className="rounded border justify-self-end"
                  unoptimized
                />
              </div>
            </div>

            <div className="mt-4 flex justify-between flex-wrap gap-4">
              <a
                href="http://localhost:3000/admin/bills"
                className="inline-block px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition duration-200 transform hover:scale-105"
              >
                กลับไปหน้ารายการบิลทั้งหมด
              </a>

              {bill.status === "PAID" && (
                <a
                  href={`/bills/${bill.id}/print`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-200 transform hover:scale-105"
                >
                  ดูใบเสร็จ
                </a>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
