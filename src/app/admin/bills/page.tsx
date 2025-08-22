"use client";
 
import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { toast, Toaster } from "react-hot-toast";
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
  room: { roomNumber: string };
  tenant: { firstName: string; lastName: string };
};
 
export default function AdminBillListPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
 
  useEffect(() => {
    fetchBills();
  }, []);
 
  const fetchBills = async () => {
    try {
      const res = await fetch("/api/admin/bills");
      if (!res.ok) throw new Error("โหลดข้อมูลบิลไม่สำเร็จ");
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
 
  const filteredBills = bills.filter((bill) => {
    const tenantName = `${bill.tenant?.firstName} ${bill.tenant?.lastName}`.toLowerCase();
    return tenantName.includes(searchTerm.toLowerCase());
  });
 
  const getStatusLabel = (status: BillStatus) => {
  switch (status) {
    case "PAID":
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 font-semibold text-sm">
          <i className="ri-checkbox-circle-fill"></i> Paid
        </span>
      );
    case "PENDING_APPROVAL":
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-100 text-yellow-500 font-semibold text-sm">
          <i className="ri-indeterminate-circle-fill"></i> Pending
        </span>
      );
    case "UNPAID":
    default:
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 text-red-700 font-semibold text-sm">
          <i className="ri-close-circle-fill"></i> Unpaid
        </span>
      );
  }
};
 
 
  return (
    <div className="flex min-h-screen">
      <Sidebar role="admin" />
 
      <div className="flex-1 p-4 max-w-5xl mx-auto mt-5">
        <Toaster position="top-right" />
 
        {/* Header + Search */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#0F3659]">Bills Management</h1>
            <p className="text-gray-600">Here are all your bills, they can be managed.</p>
          </div>
 
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center border border-gray-300 rounded w-full sm:w-auto overflow-hidden">
              <span className="flex items-center px-2 text-gray-500">
                <i className="ri-search-line text-xl"></i>
              </span>
              <input
                type="text"
                placeholder="Search tenant name"
                className="flex-1 px-2 py-2 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
 
            <Link href="/admin/bills/create">
              <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                + New Bill
              </button>
            </Link>
          </div>
        </div>
 
        {/* Table */}
        <div className="overflow-x-auto bg-gray-100 rounded-lg shadow-lg mt-8 ">
          <table className="w-full border text-sm border-gray-200">
            <thead className="border border-gray-200 bg-white text-left text-s font-semibold text-gray-600">
              <tr>
                <th className="px-4 py-3 border-b border-gray-200">Month</th>
                <th className="px-4 py-3 border-b border-gray-200">Room</th>
                <th className="px-4 py-3 border-b border-gray-200">Tenant</th>
                <th className="px-4 py-3 border-b border-gray-200">Total</th>
                <th className="px-4 py-3 border-b border-gray-200">Status</th>
                <th className="px-4 py-3 border-b border-gray-200 text-center">Manage</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-4 ">Loading...</td>
                </tr>
              ) : filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-4">No bills found.</td>
                </tr>
              ) : (
                filteredBills.map((bill) => (
                  <tr
                    key={bill.id}
                    className="border-b bg-white border-gray-200  hover:bg-gray-200  transition cursor-pointer"
                    onClick={(e) => {
                      if ((e.target as HTMLElement).tagName === "BUTTON") return;
                      window.location.href = `/admin/bills/${bill.id}`;
                    }}
                  >
                    <td className="px-4 py-3">{format(new Date(bill.billingMonth), "MMMM yyyy")}</td>
                    <td className="px-4 py-3">{bill.room?.roomNumber || "-"}</td>
                    <td className="px-4 py-3">{bill.tenant?.firstName} {bill.tenant?.lastName}</td>
                    <td className="px-4 py-3 font-semibold ">{bill.totalAmount.toFixed(2)} Bath</td>
                    <td className="px-4 py-3">{getStatusLabel(bill.status)}</td>
                    <td className="px-4 py-3 text-center space-x-2">
                      {bill.status !== "PAID" && (
                        <button
                          onClick={async (e) => {
                            e.stopPropagation(); // ป้องกันไม่ให้ tr คลิกไปหน้าอื่น
                            if (!window.confirm("Are you sure you want to delete this bill??")) return;
                            try {
                              const res = await fetch(`/api/admin/bills/${bill.id}`, { method: "DELETE" });
                              if (!res.ok) throw new Error("Failed to delete bill");
                              toast.success("Bill deleted successfully");
                              fetchBills();
                            } catch {
                              toast.error("An error occurred while deleting.");
                            }
                          }}
                          className="text-red-500 hover:underline"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}