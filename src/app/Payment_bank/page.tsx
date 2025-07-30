'use client'

/* eslint-disable @next/next/no-img-element */
import React from "react";
import Sidebar from "@/components/sidebar"; // ✅ เพิ่ม Sidebar

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

export default function PaymentPage() {
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
    <div className="min-h-screen flex bg-white">
      <Sidebar role="user" />

      <div className="flex-1 flex flex-col justify-center">
        <div className="w-full h-full px-50 py-10 rounded shadow">
          <h1 className="text-black text-2xl font-bold mb-1">
            Bills & Payments
          </h1>
          <p className="text-gray-500 mb-6">Manage your bills and rent</p>

          <p className="mb-4 font-semibold text-[#0F3659]">
            Please select a bank account
          </p>

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
                    {/* ✅ เลขบัญชีเป็นสีดำ */}
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
        </div>
      </div>
    </div>
  );
}
