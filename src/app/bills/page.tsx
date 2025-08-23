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

type BankAccount = {
  id: number;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  branch?: string;
  bankLogoUrl: string;
};

const bankAccounts: BankAccount[] = [
  {
    id: 1,
    bankName: "Kasikorn Bank",
    accountNumber: "123456789123456",
    accountHolder: "John Doe",
    branch: "University of Phayao",
    bankLogoUrl:
      "https://www.matichon.co.th/wp-content/uploads/2023/02/%E0%B8%81%E0%B8%AA%E0%B8%B4%E0%B8%81%E0%B8%A3%E0%B9%84%E0%B8%97%E0%B8%A2.jpg",
  },
  {
    id: 2,
    bankName: "Krungthai Bank",
    accountNumber: "123456789123456",
    accountHolder: "John Doe",
    branch: "University of Phayao",
    bankLogoUrl:
      "https://fortunetown.co.th/wp-content/uploads/2021/09/Logo-BANK-04-2048x2048.jpg",
  },
  {
    id: 3,
    bankName: "Government Savings Bank",
    accountNumber: "123456789123456",
    accountHolder: "John Doe",
    branch: "University of Phayao",
    bankLogoUrl: "https://saverasia.com/images/site/GSB.png",
  },
];

export default function BillsPage() {
  const [activeTab, setActiveTab] = useState<"bills" | "payments">("bills");
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
          <span className="items-center gap-1 text-green-600 bg-green-100 inline-flex px-2 rounded-full text-xs font-medium">
            <i className="ri-checkbox-circle-fill text-lg"></i> Paid
          </span>
        );
      case "PENDING_APPROVAL":
        return (
          <span className="items-center gap-1 text-yellow-500 bg-amber-100 inline-flex px-2 rounded-full text-xs font-medium">
            <i className="ri-indeterminate-circle-fill text-lg"></i> Pending
          </span>
        );
      case "UNPAID":
      default:
        return (
          <span className="items-center gap-1 text-red-600 bg-red-100 font-medium inline-flex px-2 rounded-full text-xs">
            <i className="ri-close-circle-fill text-lg"></i> Unpaid
          </span>
        );
    }
  };

  const handleCopy = async (accountNumber: string) => {
    try {
      await navigator.clipboard.writeText(accountNumber);
      alert("Copied account number: " + accountNumber);
    } catch (err) {
      alert("Failed to copy account number. Please try manually.");
      console.error("Clipboard copy failed:", err);
    }
  };

  return (
    <div className="flex min-h-screen bg-white text-black">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-200 sticky top-0 h-screen">
        <Sidebar role="user" />
      </aside>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-1 text-[#0F3659]">Billing & Payments</h1>
        <p className="text-gray-500 mb-6">Manage your bills and rent</p>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab("bills")}
            className={`px-6 py-2 font-semibold ${
              activeTab === "bills"
                ? "border-b-4 border-[#0F3659] text-[#0F3659]"
                : "text-gray-500 hover:text-gray-600"
            } transition`}
          >
            Bills
          </button>
          <button
            onClick={() => setActiveTab("payments")}
            className={`px-6 py-2 font-semibold ${
              activeTab === "payments"
                ? "border-b-4 border-[#0F3659] text-[#0F3659]"
                : "text-gray-500 hover:text-gray-600"
            } transition`}
          >
            Payments
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "bills" && (
          <>
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
                    hover:bg-gray-200 hover:scale-102 transition-transform duration-200`}
                  >
                    <span className="text-gray-900 font-medium">
                      Rent bill{" "}
                      {new Date(bill.billingMonth).toLocaleDateString("en-GB", {
                        month: "long",
                        year: "numeric",
                      })}
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
          </>
        )}

        {activeTab === "payments" && (
          <div className="divide-y divide-gray-200">
            {bankAccounts.map((account) => (
              <div
                key={account.id}
                className="flex flex-wrap md:flex-nowrap items-center justify-between py-4 gap-4
                  transform transition-transform duration-200 ease-in-out
                  hover:scale-105 hover:shadow-lg rounded-md"
              >
                <div className="flex items-center space-x-4 min-w-0 flex-1">
                  <img
                    src={account.bankLogoUrl}
                    alt={account.bankName}
                    className="w-20 h-20 object-cover rounded-md"
                  />
                  <div className="min-w-0">
                    <div className="font-semibold break-all text-black">
                      {account.accountNumber}
                    </div>
                    <div className="text-sm text-gray-600">
                      Name: {account.accountHolder}
                    </div>
                    <div className="text-sm text-gray-400">
                      {account.bankName}, {account.branch}
                    </div>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <button
                    onClick={() => handleCopy(account.accountNumber)}
                    className="bg-blue-100 text-blue-700 px-4 py-2 rounded hover:bg-blue-200 transition"
                  >
                    Copy account number
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
