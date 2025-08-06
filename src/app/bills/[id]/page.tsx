"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import Image from "next/image";
import Link from "next/link";

type BillStatus = "PAID" | "UNPAID" | "PENDING_APPROVAL";

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
};

export default function BillDetailPage() {
  const params = useParams();
  const router = useRouter();
  const billId = typeof params.id === "string" ? params.id : "";
  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [transactionRef, setTransactionRef] = useState("");

  useEffect(() => {
    if (!billId) return;

    const fetchBill = async () => {
      try {
        const res = await fetch(`/api/bills/${billId}`);
        if (!res.ok) throw new Error("ไม่สามารถโหลดบิลได้");
        const data = await res.json();
        setBill(data.bill);
      } catch (e) {
        console.error(e);
        toast.error("ไม่พบข้อมูลบิล");
      } finally {
        setLoading(false);
      }
    };

    fetchBill();
  }, [billId]);

  const handleUpload = async () => {
    if (!bill) return;
    if (!slipFile) return toast.error("กรุณาเลือกสลิปก่อน");
    if (!transactionRef) return toast.error("กรุณากรอกเลขอ้างอิงการโอน");

    const formData = new FormData();
    formData.append("file", slipFile);
    formData.append("transactionRef", transactionRef);

    try {
      const res = await fetch(`/api/bills/${bill.id}/upload`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        toast.success("แนบสลิปสำเร็จ");
        router.refresh();
      } else {
        const errorData = await res.json();
        toast.error("อัปโหลดไม่สำเร็จ: " + (errorData.error || "เกิดข้อผิดพลาด"));
      }
    } catch (e) {
      console.error("❌ Upload failed:", e);
      toast.error("เกิดข้อผิดพลาด");
    }
  };

  if (loading) return <p className="text-center mt-8">กำลังโหลด...</p>;
  if (!bill) return <p className="text-center mt-8">ไม่พบข้อมูลบิล</p>;

  const waterTotal = bill.waterUnit * bill.waterRate;
  const electricTotal = bill.electricUnit * bill.electricRate;

  const statusDisplay = {
    UNPAID: { text: "❌ ยังไม่ชำระ", color: "text-red-600" },
    PENDING_APPROVAL: { text: "⏳ รอตรวจสอบ", color: "text-yellow-600" },
    PAID: { text: "✅ ชำระแล้ว", color: "text-green-600" },
  };

  return (
    <div className="max-w-2xl mx-auto mt-8 p-6 bg-white text-black rounded shadow">
      <h1 className="text-2xl font-bold mb-2">บิลค่าเช่า</h1>

      <section className="mb-4">
        <div className="flex justify-between">
          <span>เดือน</span>
          <span>
            {new Date(bill.billingMonth).toLocaleDateString("th-TH", {
              year: "numeric",
              month: "long",
            })}
          </span>
        </div>
        <div className="flex justify-between">
          <span>สถานะ</span>
          <span className={statusDisplay[bill.status].color}>
            {statusDisplay[bill.status].text}
          </span>
        </div>
      </section>

      <section className="mb-4 border-t pt-4">
        <div className="flex justify-between">
          <span>ค่าเช่าห้อง</span>
          <span>{bill.rentAmount.toLocaleString()} บาท</span>
        </div>
        <div className="flex justify-between">
          <span>ค่าน้ำ</span>
          <span>{waterTotal.toLocaleString()} บาท</span>
        </div>
        <div className="flex justify-between">
          <span>ค่าไฟ</span>
          <span>{electricTotal.toLocaleString()} บาท</span>
        </div>
        <div className="flex justify-between font-bold text-yellow-700 mt-2">
          <span>รวมทั้งหมด</span>
          <span>{bill.totalAmount.toLocaleString()} บาท</span>
        </div>
      </section>

      {bill.status === "PENDING_APPROVAL" && bill.paymentSlipUrl && (
        <div className="mt-6">
          <p className="text-yellow-600 font-semibold mb-2">
            ⏳ ระบบได้รับสลิปของคุณแล้ว รอการตรวจสอบจากเจ้าของหอพัก
          </p>
          <Image
            src={bill.paymentSlipUrl}
            alt="slip"
            width={400}
            height={250}
            className="rounded border"
            unoptimized
          />
        </div>
      )}

      {bill.status === "PAID" && (
        <div className="mt-6">
          <p className="text-green-600 font-semibold mb-2">🧾 ชำระเงินเรียบร้อยแล้ว</p>
          {bill.paymentSlipUrl && (
            <Image
              src={bill.paymentSlipUrl}
              alt="slip"
              width={400}
              height={250}
              className="rounded border mb-2"
              unoptimized
            />
          )}
          <Link
            href={`/bills/${bill.id}/print`}
            target="_blank"
            className="text-blue-600 underline"
          >
            🧾 ดูใบเสร็จ
          </Link>
        </div>
      )}

      {bill.status === "UNPAID" && (
        <>
          <section className="mb-4">
            <label className="block font-medium mb-1 text-blue-800">
              เลขอ้างอิงการโอน (Transaction Ref)
            </label>
            <input
              type="text"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="เช่น 0123456789"
            />
          </section>

          <section className="mt-4">
            <label className="block font-medium mb-1 text-blue-800">แนบสลิปโอนเงิน</label>
            <div className="flex items-center gap-2">
              <input type="file" onChange={(e) => setSlipFile(e.target.files?.[0] || null)} />
              <button
                onClick={handleUpload}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                📤 Upload
              </button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}