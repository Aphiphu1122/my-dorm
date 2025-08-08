"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "react-hot-toast";
import Sidebar from "@/components/sidebar";

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
  createdAt: string;
  room: {
    roomNumber: string;
  };
  tenant: {
    firstName: string;
    lastName: string;
  };
};

export default function AdminBillListPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      const res = await fetch("/api/admin/bills");
      if (!res.ok) {
        throw new Error("โหลดข้อมูลบิลไม่สำเร็จ");
      }
      const data = await res.json();
      setBills(data);
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการโหลดบิล"
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status: BillStatus) => {
    switch (status) {
      case "PAID":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-green-700 bg-green-100 font-semibold text-sm">
            Paid
          </span>
        );
      case "PENDING_APPROVAL":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-yellow-700 bg-yellow-100 font-semibold text-sm">
            Pending
          </span>
        );
      case "UNPAID":
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-red-700 bg-red-100 font-semibold text-sm">
            Unpaid
          </span>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar role="admin" />

      {/* Main content */}
      <main className="flex-1 p-8 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">All Bills</h1>
            <h2 className=" text-gray-400 mt-2">Manage your bills and rent</h2>
          </div>
          <Link href="/admin/bills/create">
            <button className="bg-[#0F3659] text-white px-5 py-2 rounded-lg shadow hover:bg-blue-950 transition">
              + New Bill
            </button>
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 border-solid border-b-transparent"></div>
          </div>
        ) : bills.length === 0 ? (
          <p className="text-center text-gray-500 text-lg mt-10">No bills yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  {["Month", "Room", "Tenant", "Total", "Status", "Manage"].map(
                    (header) => (
                      <th
                        key={header}
                        className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                      >
                        {header}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bills.map((bill) => (
                  <tr
                    key={bill.id}
                    className="hover:bg-gray-200 cursor-pointer transition-colors duration-150 ease-in-out"
                    onClick={() => {
                      window.location.href = `/admin/bills/${bill.id}`;
                    }}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        window.location.href = `/admin/bills/${bill.id}`;
                      }
                    }}
                    role="link"
                    aria-label={`View details for bill of room ${bill.room.roomNumber} for month ${format(
                      new Date(bill.billingMonth),
                      "MMMM yyyy"
                    )}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      {format(new Date(bill.billingMonth), "MMMM yyyy")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      {bill.room?.roomNumber || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      {bill.tenant?.firstName} {bill.tenant?.lastName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">
                      {bill.totalAmount.toFixed(2)} Baht
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusLabel(bill.status)}
                    </td>
                    <td
                      className="px-6 py-4 whitespace-nowrap text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {bill.status !== "PAID" && (
                        <button
                        onClick={async () => {
                          const confirmed = window.confirm("Are you sure you want to delete this bill?");
                          if (!confirmed) return;

                          try {
                            const res = await fetch(`/api/admin/bills/${bill.id}`, {
                              method: "DELETE",
                            });

                            if (!res.ok) {
                              throw new Error("Failed to delete bill");
                            }

                            toast.success("Bill deleted successfully");
                            fetchBills();
                          } catch (err) {
                            toast.error("An error occurred while deleting.");
                            console.error(err);
                          }
                        }}
                        className="text-gray-400 hover:text-gray-700 text-2xl transition-colors"
                        aria-label="Delete bill"
                      >
                        <i className="ri-delete-bin-line"></i>
                        <style jsx>{`
                          button:hover i.ri-delete-bin-line {
                            display: none;
                          }
                          button:hover i.ri-delete-bin-fill {
                            display: inline;
                          }
                          i.ri-delete-bin-fill {
                            display: none;
                          }
                        `}</style>
                        <i className="ri-delete-bin-fill"></i>
                      </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
