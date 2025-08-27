"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import Image from "next/image";
import Link from "next/link";
import Sidebar from "@/components/sidebar";


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
  const now = new Date();
  const defaultDateTime = now.toISOString().slice(0, 16);

  const [paymentDate, setPaymentDate] = useState(defaultDateTime);



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
    if (!slipFile) return toast.error("Please select a slip first.");
    if (!transactionRef) return toast.error("Please enter the transfer reference number.");

    const formData = new FormData();
    formData.append("file", slipFile);
    formData.append("paymentDate", paymentDate);
    formData.append("transactionRef", transactionRef);

    try {
      const res = await fetch(`/api/bills/${bill.id}/upload`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        toast.success("Attached slip successfully");
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

  if (loading)
    return <p className="text-center mt-8 text-gray-500">Loading...</p>;
  if (!bill)
    return <p className="text-center mt-8 text-gray-500">Bill information not found</p>;

  const waterTotal = bill.waterUnit * bill.waterRate;
  const electricTotal = bill.electricUnit * bill.electricRate;

  const statusDisplay = {
  UNPAID: {
    text: "Unpaid",
    color: "text-red-600",
    icon: <i className="ri-close-circle-fill" />,
  },
  PENDING_APPROVAL: {
    text: "Pending",
    color: "text-yellow-500",
    icon: <i className="ri-indeterminate-circle-fill" />,
  },
  PAID: {
    text: "Paid",
    color: "text-green-600",
    icon: <i className="ri-checkbox-circle-fill" />,
  },
};

  return (
    <div className="flex min-h-screen bg-white text-black">
      <aside className="w-64 border-r border-gray-200 sticky top-0 h-screen">
        <Sidebar role="user" />
      </aside>
 
      <main className="flex-1 max-w-5xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-1 text-[#0F3659]">Bills </h1>
        <p className="text-gray-500 mb-8">Manage your bills and rent</p>
 
 
          <h2 className="text-lg font-semibold text-[#0F3659] mb-1">
            Rent bill{" "}
            {new Date(bill.billingMonth).toLocaleDateString("en-GB", {
              month: "long",
              year: "numeric",
            })}
          </h2>
          <section className="mb-6 bg-white shadow-md rounded-lg p-2 flex justify-between items-center">
     
            <span className="text-gray-700 font-medium p-2 ">Bill Status</span>
            <span
              className={`${statusDisplay[bill.status].color} font-semibold flex items-center gap-1`}
            >
              <span>{statusDisplay[bill.status].icon}</span> {statusDisplay[bill.status].text}
            </span>
         
        </section>
 
        {/* Bill Items */}
          <h3 className="text-md font-semibold text-[#0F3659] mb-1">Bill item</h3>
            <section className="bg-white shadow-md rounded-lg p-2">
              <div className="divide-y divide-gray-200">
                <div className="flex justify-between py-3 p-2 text-gray-700">
                  <span>Room Rent</span>
                  <span>{bill.rentAmount.toLocaleString()} Bath</span>
                </div>
                <div className="flex justify-between py-3 p-2 text-gray-700">
                  <span>Water Bill</span>
                  <span>{waterTotal.toLocaleString()} Bath</span>
                </div>
                <div className="flex justify-between py-3 p-2 text-gray-700">
                  <span>Electricity Bill</span>
                  <span>{electricTotal.toLocaleString()} Bath</span>
                </div>
                <div className="flex justify-between py-3  p-2 font-bold text-yellow-700">
                  <span>Total</span>
                  <span>{bill.totalAmount.toLocaleString()} Bath</span>
                </div>
              </div>
            </section>
 
        {/* Payment slip & upload */}
        {bill.status === "PENDING_APPROVAL" && bill.paymentSlipUrl && (
          <div className="mt-6 p-6 bg-yellow-50 rounded-lg shadow-sm text-yellow-700 font-semibold">
            {statusDisplay.PENDING_APPROVAL.icon} The system has received your slip. Waiting for verification from the dormitory owner.
            <div className="mt-4 max-w-md">
              <Image
                src={bill.paymentSlipUrl}
                alt="payment slip"
                width={200}
                height={125}
                className="rounded-md border"
                unoptimized
              />
            </div>
          </div>
        )}
 
        {bill.status === "PAID" && (
          <div className="mt-6 p-6 bg-green-50 rounded-lg shadow-sm text-green-700 font-semibold">
            {statusDisplay.PAID.icon} Payment completed
            {bill.paymentSlipUrl && (
              <div className="mt-4 max-w-md">
                <Image
                  src={bill.paymentSlipUrl}
                  alt="payment slip"
                  width={200}
                  height={125}
                  className="rounded-md border mb-2"
                  unoptimized
                />
                <Link
                  href={`/bills/${bill.id}/print`}
                  target="_blank"
                  className="text-[#0F3659] underline"
                >
                  View receipt
                </Link>
              </div>
            )}
          </div>
        )}
 
        {bill.status === "UNPAID" && (
          <section className="bg-white shadow-md rounded-lg p-3 mt-8">
            <label className="block font-medium mb-2 text-blue-800">
              Transaction Ref
            </label>
            <input
              type="text"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. 0123456789"
            />

            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Date & Time
            </label>
            <input
              type="datetime-local"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              required
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
 
            <label className="block font-medium mt-6 mb-2 text-blue-800">
              Upload payment slip
            </label>
            <div className="flex items-center gap-3">
              <input
                type="file"
                onChange={(e) => setSlipFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border file:border-gray-300 file:text-gray-700 file:bg-white hover:file:bg-gray-100 cursor-pointer"
              />
              <button
                onClick={handleUpload}
                className="bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 transition"
              >
                Upload
              </button>
            </div>
          </section>
        )}
        <div className="flex justify-end">
           <a
              href="http://localhost:3000/bills"
              className="inline-block mt-5 px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition duration-200 transform hover:scale-105"
              >Back to All Bills
            </a>
         </div>
      </main>
    </div>
  );
}