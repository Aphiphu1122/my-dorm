"use client";

import { useEffect, useState } from "react";
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
  room: { roomNumber: string };
  tenant: { firstName: string; lastName: string };
};

type RoomWithTenant = {
  id: string;
  roomNumber: string;
  tenantId: string;
  tenant: { id: string; firstName: string; lastName: string };

  lastWater: number;
  lastElectric: number;
};

export default function AdminBillListPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);

  // form state
  const [tenantRooms, setTenantRooms] = useState<RoomWithTenant[]>([]);
  const [form, setForm] = useState({
    tenantId: "",
    roomId: "",
    billingMonth: "",
    rentAmount: 3000,

    waterPrev: 0,
    waterCurr: 0,
    waterRate: 8,

    electricPrev: 0,
    electricCurr: 0,
    electricRate: 10,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchBills();
    fetchRooms();
  }, []);

  const fetchBills = async () => {
    try {
      const res = await fetch("/api/admin/bills");
      if (!res.ok) throw new Error("โหลดข้อมูลบิลไม่สำเร็จ");
      const data = await res.json();
      setBills(data);
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการโหลดบิล");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async () => {
    const res = await fetch("/api/admin/active-tenants");
    const data = await res.json();
    setTenantRooms(data);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        name.includes("Amount") ||
        name.includes("Prev") ||
        name.includes("Curr") ||
        name.includes("Rate")
          ? value === "" ? "" : parseFloat(value)
          : value,
    }));
  };

    const handleTenantSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedTenantId = e.target.value;
    const room = tenantRooms.find((r) => r.tenantId === selectedTenantId);
    if (room) {
      setForm((prev) => ({
        ...prev,
        tenantId: selectedTenantId,
        roomId: room.id,
        waterPrev: room.lastWater || 0,
        electricPrev: room.lastElectric || 0,
      }));
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("เกิดข้อผิดพลาด");
      toast.success("สร้างบิลเรียบร้อยแล้ว");
      setShowModal(false);
      fetchBills();
    } catch {
      toast.error("สร้างบิลไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  };

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
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 font-semibold text-sm">
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

  // ✅ คำนวณ unit preview
  const waterUnit = form.waterCurr - form.waterPrev;
  const electricUnit = form.electricCurr - form.electricPrev;
  const totalPreview =
    form.rentAmount +
    (waterUnit > 0 ? waterUnit * form.waterRate : 0) +
    (electricUnit > 0 ? electricUnit * form.electricRate : 0);

  return (
    <div className="flex min-h-screen">
      <Sidebar role="admin" />

      {/* Content */}
      <div className="flex-1 p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#0F3659]">Bills Management</h1>
            <p className="text-gray-600">Here are all your bills, they can be managed.</p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Search */}
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

            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              + New Bill
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto bg-gray-100 rounded-lg shadow-lg mt-8">
          <table className="w-full border text-sm border-gray-200">
            <thead className="bg-gray-100 text-left text-s font-semibold text-gray-600">
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
                  <td colSpan={6} className="text-center py-4">
                    Loading...
                  </td>
                </tr>
              ) : bills.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-4">
                    No bills found.
                  </td>
                </tr>
              ) : (
                bills
                  .filter((bill) =>
                    `${bill.tenant.firstName} ${bill.tenant.lastName}`
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase())
                  )
                  .map((bill) => (
                    <tr
                      key={bill.id}
                      className="border-b border-gray-200 bg-white hover:bg-gray-200 transition cursor-pointer"
                      onClick={() => (window.location.href = `/admin/bills/${bill.id}`)}
                    >
                      <td className="px-4 py-3">
                        {format(new Date(bill.billingMonth), "MMMM yyyy")}
                      </td>
                      <td className="px-4 py-3">{bill.room.roomNumber}</td>
                      <td className="px-4 py-3">
                        {bill.tenant.firstName} {bill.tenant.lastName}
                      </td>
                      <td className="px-4 py-3 font-semibold">
                        {bill.totalAmount.toFixed(2)} Baht
                      </td>
                      <td className="px-4 py-3">{getStatusLabel(bill.status)}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (!window.confirm("Delete this bill?")) return;
                            try {
                              const res = await fetch(`/api/admin/bills/${bill.id}`, {
                                method: "DELETE",
                              });
                              if (!res.ok) throw new Error();
                              toast.success("Bill deleted");
                              fetchBills();
                            } catch {
                              toast.error("Delete failed");
                            }
                          }}
                          className="text-gray-400 bg-gray-200 rounded-full p-2 w-10 h-10  items-center justify-center hover:text-red-700 hover:scale-125 transition-transform duration-200"
                          title="Delete Bill"
                        >
                          <i className="ri-delete-bin-fill text-lg "></i>
                        </button>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ✅ Modal สำหรับสร้างบิล */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl p-8 relative animate-fade-in">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              ✖
            </button>

            <h2 className="text-2xl font-bold mb-4">Create New Bill</h2>

            <div className="space-y-4">
              {/* Tenant */}
              <div>
                <label className="block text-sm font-medium mb-1">Tenant</label>
                <select
                  name="tenantId"
                  value={form.tenantId}
                  onChange={handleTenantSelect}
                  className="border p-2 w-full rounded  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                >
                  <option value="">-- Select Tenant --</option>
                {tenantRooms.map((room) => (
                  <option key={room.tenantId} value={room.tenantId}>
                    Room {room.roomNumber} - {room.tenant.firstName} {room.tenant.lastName}
                  </option>
                  ))}
                </select>
              </div>

              {/* Billing Month */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Billing Month
                </label>
                <input
                  type="month"
                  name="billingMonth"
                  value={form.billingMonth}
                  onChange={handleChange}
                  className="border p-2 w-full rounded  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>

              {/* Rent */}
              <div>
                <label className="block text-sm font-medium mb-1">Rent</label>
                <input
                  type="number"
                  name="rentAmount"
                  placeholder="Enter room rent"
                  value={form.rentAmount || ""}
                  onChange={handleChange}
                  className="border p-2 w-full rounded  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>

              {/* Water Meter */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Water Prev
                  </label>
                  <input
                    type="number"
                    name="waterPrev"
                    value={form.waterPrev || ""}
                    onChange={handleChange}
                    placeholder="Previous water meter"
                    className="border p-2 w-full rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Water Curr
                  </label>
                  <input
                    type="number"
                    name="waterCurr"
                    value={form.waterCurr || ""}
                    onChange={handleChange}
                    placeholder="Current water meter"
                    className="border p-2 w-full rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Water Rate
                  </label>
                  <input
                    type="number"
                    name="waterRate"
                    value={form.waterRate || ""}
                    onChange={handleChange}
                    className="border p-2 w-full rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Electric Meter */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Electric Prev
                  </label>
                  <input
                    type="number"
                    name="electricPrev"
                    value={form.electricPrev || ""}
                    onChange={handleChange}
                    placeholder="Previous electric meter"
                    className="border p-2 w-full rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Electric Curr
                  </label>
                  <input
                    type="number"
                    name="electricCurr"
                    value={form.electricCurr || ""}
                    onChange={handleChange}
                    placeholder="Current electric meter"
                    className="border p-2 w-full rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Electric Rate
                  </label>
                  <input
                    type="number"
                    name="electricRate"
                    value={form.electricRate || ""}
                    onChange={handleChange}
                    className="border p-2 w-full rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Preview */}
              <div className="mt-4 p-3 bg-gray-100 rounded-lg text-sm">
                <p>
                  น้ำใช้ไป:{" "}
                  <span className="font-semibold">
                    {waterUnit >= 0 ? waterUnit : 0}
                  </span>{" "}
                  หน่วย
                </p>
                <p>
                  ไฟใช้ไป:{" "}
                  <span className="font-semibold">
                    {electricUnit >= 0 ? electricUnit : 0}
                  </span>{" "}
                  หน่วย
                </p>
                <p>
                  รวมทั้งหมด:{" "}
                  <span className="font-bold text-blue-600">
                    {totalPreview.toFixed(2)} ฿
                  </span>
                </p>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
              >
                {submitting ? "Creating..." : "Create Bill"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}