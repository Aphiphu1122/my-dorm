"use client";
 
import { useEffect, useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/sidebar";
 
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
        return (
          <span className=" items-center gap-1 text-green-600 bg-green-100 inline-flex  px-2 rounded-full text-xs  gap-1font-medium">
            <i className="ri-checkbox-circle-fill text-lg"></i> Paid
          </span>
        );
      case "PENDING_APPROVAL":
        return (
          <span className=" items-center gap-1 text-yellow-500 bg-amber-100 inline-flex  px-2 rounded-full text-xs  gap-1font-medium">
            <i className="ri-indeterminate-circle-fill text-lg"></i> Pending
          </span>
        );
      case "UNPAID":
      default:
        return (
          <span className=" items-center gap-1 text-red-600 bg-red-100 font-medium inline-flex  px-2 rounded-full text-xs  gap-1font-medium">
            <i className="ri-close-circle-fill text-lg"></i> Unpaid
          </span>
        );
    }
  };
 
  return (
    <div className="flex min-h-screen bg-white text-black">
      <aside className="w-64 border-r border-gray-200 sticky top-0 h-screen">
        <Sidebar role="user" />
      </aside>
 
      <main className="flex-1 max-w-4xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-1 text-[#0F3659]">Bills & Payments</h1>
        <p className="text-gray-500 mb-6">Manage your bills and rent</p>
 
        {loading ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : bills.length === 0 ? (
          <p className="text-center text-gray-500">No bills found.</p>
        ) : (
          <div className="rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            {bills.map((bill, idx) => (
              <Link
                key={bill.id}
                href={`/bills/${bill.id}`}
                className={`flex justify-between items-center px-6 py-4 cursor-pointer
                  ${idx !== bills.length - 1 ? "border-b border-gray-200" : ""}
                  hover:bg-gray-200 hover:scale-102 transition-transform duration-200
                `}
              >
                <span className="text-gray-900 font-medium">
                  Rent bill {new Date(bill.billingMonth).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
                </span>
 
                <span className="flex items-center gap-3">
                  {renderStatus(bill.status)}
 
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </Link>
 
            ))}
          </div>
        )}
      </main>
    </div>
  );
}