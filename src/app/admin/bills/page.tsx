"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { toast } from "react-hot-toast";
import Sidebar from "@/components/sidebar";

type BillStatus = "UNPAID" | "PENDING_APPROVAL" | "PAID";

type Bill = {
  id: string;
  billingMonth: string;
  totalAmount: number;
  status: BillStatus;
  createdAt: string;
  room: { roomNumber: string };
  tenant: { firstName: string; lastName: string };
};

type RoomWithTenant = {
  id: string;
  roomNumber: string;
  tenantId: string | null;
  tenant: { id: string; firstName: string; lastName: string } | null;
  lastWater: number;
  lastElectric: number;
};

type BillsResponse =
  | {
      success: true;
      data: Bill[];
      meta: { page: number; pageSize: number; total: number; totalPages: number };
    }
  | Bill[]; // เผื่อกรณีที่ API เก่ายังส่งเป็น array ตรง ๆ

type Meta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

const PAGE_SIZE_OPTIONS = [10, 20, 50];

export default function AdminBillListPage() {
  // ---------- table state ----------
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState<Meta>({ page: 1, pageSize: 10, total: 0, totalPages: 1 });

  // ---------- filters ----------
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"" | BillStatus>("");
  const [month, setMonth] = useState<string>(""); // YYYY-MM
  const [roomNumber, setRoomNumber] = useState("");

  // ---------- create modal ----------
  const [showModal, setShowModal] = useState(false);
  const [tenantRooms, setTenantRooms] = useState<RoomWithTenant[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // ฟอร์มสร้างบิล
  const [form, setForm] = useState<{
    tenantId: string;
    roomId: string;
    billingMonth: string; // YYYY-MM
    rentAmount: number | "";
    waterPrev: number | "";
    waterCurr: number | "";
    waterRate: number | "";
    electricPrev: number | "";
    electricCurr: number | "";
    electricRate: number | "";
  }>({
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

  // คำนวณพรีวิว
  const waterUnit = useMemo(() => {
    const a = Number(form.waterCurr) - Number(form.waterPrev);
    return Number.isFinite(a) ? Math.max(a, 0) : 0;
  }, [form.waterCurr, form.waterPrev]);

  const electricUnit = useMemo(() => {
    const a = Number(form.electricCurr) - Number(form.electricPrev);
    return Number.isFinite(a) ? Math.max(a, 0) : 0;
  }, [form.electricCurr, form.electricPrev]);

  const totalPreview = useMemo(() => {
    const rent = Number(form.rentAmount) || 0;
    const wRate = Number(form.waterRate) || 0;
    const eRate = Number(form.electricRate) || 0;
    return rent + waterUnit * wRate + electricUnit * eRate;
  }, [form.rentAmount, form.waterRate, form.electricRate, waterUnit, electricUnit]);

  // ---------- effects ----------
  useEffect(() => {
    void fetchBills();
    void fetchRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta.page, meta.pageSize, q, status, month, roomNumber]);

  // ---------- API calls ----------
  async function fetchBills() {
    setLoading(true);
    try {
      const usp = new URLSearchParams();
      usp.set("page", String(meta.page));
      usp.set("pageSize", String(meta.pageSize));
      if (q.trim()) usp.set("q", q.trim());
      if (status) usp.set("status", status);
      if (roomNumber.trim()) usp.set("roomNumber", roomNumber.trim());
      if (month) usp.set("month", month); // YYYY-MM

      const res = await fetch(`/api/admin/bills?${usp.toString()}`, {
        credentials: "include",
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "โหลดข้อมูลบิลไม่สำเร็จ");
      }
      const json: BillsResponse = await res.json();

      if (Array.isArray(json)) {
        // เผื่อ API เก่าคืนเป็น Array
        setBills(json);
        setMeta((m) => ({ ...m, total: json.length, totalPages: 1 }));
      } else {
        setBills(json.data);
        setMeta(json.meta);
      }
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการโหลดบิล";
      toast.error(msg);
      setBills([]);
      setMeta((m) => ({ ...m, total: 0, totalPages: 1 }));
    } finally {
      setLoading(false);
    }
  }

  async function fetchRooms() {
    try {
      const res = await fetch("/api/admin/active-tenants", { credentials: "include" });
      if (!res.ok) throw new Error("โหลดข้อมูลผู้เช่าไม่สำเร็จ");
      const data: RoomWithTenant[] = await res.json();
      setTenantRooms(data);
    } catch (err: unknown) {
      console.error(err);
      toast.error("โหลดผู้เช่าที่กำลังพักอยู่ไม่สำเร็จ");
    }
  }

  // ---------- handlers ----------
  function handleCreateInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    const isNumberField =
      name === "rentAmount" ||
      name === "waterPrev" ||
      name === "waterCurr" ||
      name === "waterRate" ||
      name === "electricPrev" ||
      name === "electricCurr" ||
      name === "electricRate";

    setForm((prev) => ({
      ...prev,
      [name]: isNumberField ? (value === "" ? "" : Number(value)) : value,
    }));
  }

  function handleTenantSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    const selectedTenantId = e.target.value;
    const room = tenantRooms.find((r) => r.tenantId === selectedTenantId);
    if (room) {
      setForm((prev) => ({
        ...prev,
        tenantId: selectedTenantId,
        roomId: room.id,
        waterPrev: room.lastWater ?? 0,
        electricPrev: room.lastElectric ?? 0,
      }));
    } else {
      setForm((prev) => ({ ...prev, tenantId: selectedTenantId, roomId: "" }));
    }
  }

  async function handleSubmit() {
    // แปลง YYYY-MM → YYYY-MM-01 ให้ชัวร์
    const monthIso = form.billingMonth ? `${form.billingMonth}-01` : "";
    if (!form.tenantId || !form.roomId || !monthIso) {
      toast.error("กรอกข้อมูลให้ครบถ้วน");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/bills", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          billingMonth: monthIso,
        }),
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(errText || "สร้างบิลไม่สำเร็จ");
      }
      toast.success("สร้างบิลเรียบร้อยแล้ว");
      setShowModal(false);
      // รีเซ็ตหน้า และโหลดใหม่
      setMeta((m) => ({ ...m, page: 1 }));
      void fetchBills();
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "สร้างบิลไม่สำเร็จ";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  // ---------- helpers ----------
  function statusBadge(s: BillStatus) {
    if (s === "PAID") {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 font-semibold text-sm">
          <i className="ri-checkbox-circle-fill" /> ชำระแล้ว
        </span>
      );
    }
    if (s === "PENDING_APPROVAL") {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 font-semibold text-sm">
          <i className="ri-indeterminate-circle-fill" /> รออนุมัติ
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 text-red-700 font-semibold text-sm">
        <i className="ri-close-circle-fill" /> ยังไม่ชำระ
      </span>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <aside className="w-64 border-r border-gray-200 sticky top-0 h-screen">
        <Sidebar role="admin" />
      </aside>

      <div className="flex-1 p-8 max-w-6xl mx-auto">
        {/* Header + Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#0F3659] whitespace-nowrap">
              จัดการบิล
            </h1>
            <p className="text-gray-600">จัดการบิลทั้งหมด</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* q */}
            <div className="flex items-center border border-gray-300 rounded overflow-hidden bg-white">
              <span className="px-2 text-gray-500">
                <i className="ri-search-line text-xl" />
              </span>
              <input
                type="text"
                placeholder="ค้นหา (ชื่อผู้ใช้)"
                className="px-2 py-2 outline-none"
                value={q}
                onChange={(e) => {
                  setMeta((m) => ({ ...m, page: 1 }));
                  setQ(e.target.value);
                }}
              />
            </div>

            {/* roomNumber */}
            <input
              type="text"
              placeholder="เลขห้อง"
              className="border border-gray-300 rounded px-3 py-2 bg-white"
              value={roomNumber}
              onChange={(e) => {
                setMeta((m) => ({ ...m, page: 1 }));
                setRoomNumber(e.target.value);
              }}
            />

            {/* month */}
            <input
              type="month"
              className="border border-gray-300 rounded px-3 py-2 bg-white"
              value={month}
              onChange={(e) => {
                setMeta((m) => ({ ...m, page: 1 }));
                setMonth(e.target.value);
              }}
            />

            {/* status */}
            <select
              className="border border-gray-300 rounded px-3 py-2 bg-white"
              value={status}
              onChange={(e) => {
                setMeta((m) => ({ ...m, page: 1 }));
                setStatus(e.target.value as "" | BillStatus);
              }}
            >
              <option value="">ทุกสถานะ</option>
              <option value="UNPAID">ยังไม่ชำระ</option>
              <option value="PENDING_APPROVAL">รออนุมัติ</option>
              <option value="PAID">ชำระแล้ว</option>
            </select>

            <select
              className="border border-gray-300 rounded px-3 py-2 bg-white"
              value={meta.pageSize}
              onChange={(e) =>
                setMeta((m) => ({ ...m, page: 1, pageSize: Number(e.target.value) }))
              }
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n} / หน้า
                </option>
              ))}
            </select>

            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              + สร้างบิลใหม่
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto bg-white rounded-lg shadow mt-4 border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-blue-50 text-left font-semibold text-gray-700">
              <tr>
                <th className="px-4 py-3">เดือน</th>
                <th className="px-4 py-3">ห้อง</th>
                <th className="px-4 py-3">ผู้เช่า</th>
                <th className="px-4 py-3">รวมทั้งหมด</th>
                <th className="px-4 py-3">สถานะ</th>
                <th className="px-4 py-3 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-gray-500">
                    กำลังโหลด...
                  </td>
                </tr>
              ) : bills.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-gray-500">
                    ไม่มีข้อมูลบิล
                  </td>
                </tr>
              ) : (
                bills.map((bill) => (
                  <tr
                    key={bill.id}
                    className="border-t border-gray-200 hover:bg-blue-50 transition cursor-pointer"
                    onClick={() => {
                      window.location.href = `/admin/bills/${bill.id}`;
                    }}
                  >
                    <td className="px-4 py-3">
                      {format(new Date(bill.billingMonth), "MMMM yyyy", { locale: th })}
                    </td>
                    <td className="px-4 py-3">{bill.room.roomNumber}</td>
                    <td className="px-4 py-3">
                      {bill.tenant.firstName} {bill.tenant.lastName}
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      {bill.totalAmount.toLocaleString("th-TH")} บาท
                    </td>
                    <td className="px-4 py-3">{statusBadge(bill.status)}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!window.confirm("ต้องการลบบิลนี้หรือไม่?")) return;
                          try {
                            const res = await fetch(`/api/admin/bills/${bill.id}`, {
                              method: "DELETE",
                              credentials: "include",
                            });
                            if (!res.ok) throw new Error();
                            toast.success("ลบบิลแล้ว");
                            void fetchBills();
                          } catch {
                            toast.error("ลบไม่สำเร็จ");
                          }
                        }}
                        className="text-gray-500 bg-gray-100 rounded-full p-2 w-10 h-10 inline-flex items-center justify-center hover:text-red-700 hover:scale-110 transition"
                        title="ลบบิล"
                      >
                        <i className="ri-delete-bin-fill text-lg" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <div>
            รวม {meta.total.toLocaleString()} รายการ • หน้า {meta.page} / {meta.totalPages}
          </div>
          <div className="flex gap-2">
            <button
              className="px-3 py-1 border rounded disabled:opacity-50"
              onClick={() => setMeta((m) => ({ ...m, page: Math.max(1, m.page - 1) }))}
              disabled={meta.page <= 1}
            >
              ก่อนหน้า
            </button>
            <button
              className="px-3 py-1 border rounded disabled:opacity-50"
              onClick={() =>
                setMeta((m) => ({ ...m, page: Math.min(m.totalPages, m.page + 1) }))
              }
              disabled={meta.page >= meta.totalPages}
            >
              ถัดไป
            </button>
          </div>
        </div>
      </div>

      {/* Modal สร้างบิล */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl p-8 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-2xl font-bold"
              aria-label="Close"
            >
              ✖
            </button>

            <h2 className="text-2xl font-bold mb-4 text-blue-800">สร้างบิลใหม่</h2>

            <div className="space-y-4">
              {/* Tenant */}
              <div>
                <label className="block text-sm font-medium mb-1">ผู้เช่า</label>
                <select
                  name="tenantId"
                  value={form.tenantId}
                  onChange={handleTenantSelect}
                  className="border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- เลือกผู้เช่า --</option>
                  {tenantRooms.map((room) => (
                    <option key={room.id} value={room.tenantId ?? ""}>
                      ห้อง {room.roomNumber} —{" "}
                      {room.tenant ? `${room.tenant.firstName} ${room.tenant.lastName}` : "-"}
                    </option>
                  ))}
                </select>
              </div>

              {/* Billing Month */}
              <div>
                <label className="block text-sm font-medium mb-1">เดือนที่เรียกเก็บ</label>
                <input
                  type="month"
                  name="billingMonth"
                  value={form.billingMonth}
                  onChange={handleCreateInputChange}
                  className="border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Rent */}
              <div>
                <label className="block text-sm font-medium mb-1">ค่าเช่า</label>
                <input
                  type="number"
                  name="rentAmount"
                  placeholder="ระบุค่าเช่า"
                  value={form.rentAmount}
                  onChange={handleCreateInputChange}
                  className="border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Water */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">น้ำ (ก่อนหน้า)</label>
                  <input
                    type="number"
                    name="waterPrev"
                    value={form.waterPrev}
                    onChange={handleCreateInputChange}
                    className="border p-2 w-full rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">น้ำ (ปัจจุบัน)</label>
                  <input
                    type="number"
                    name="waterCurr"
                    value={form.waterCurr}
                    onChange={handleCreateInputChange}
                    className="border p-2 w-full rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">อัตราน้ำ (บาท/หน่วย)</label>
                  <input
                    type="number"
                    name="waterRate"
                    value={form.waterRate}
                    onChange={handleCreateInputChange}
                    className="border p-2 w-full rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Electric */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">ไฟ (ก่อนหน้า)</label>
                  <input
                    type="number"
                    name="electricPrev"
                    value={form.electricPrev}
                    onChange={handleCreateInputChange}
                    className="border p-2 w-full rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">ไฟ (ปัจจุบัน)</label>
                  <input
                    type="number"
                    name="electricCurr"
                    value={form.electricCurr}
                    onChange={handleCreateInputChange}
                    className="border p-2 w-full rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">อัตราไฟ (บาท/หน่วย)</label>
                  <input
                    type="number"
                    name="electricRate"
                    value={form.electricRate}
                    onChange={handleCreateInputChange}
                    className="border p-2 w-full rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Preview */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm">
                <p>
                  น้ำใช้ไป: <span className="font-semibold">{waterUnit}</span> หน่วย
                </p>
                <p>
                  ไฟใช้ไป: <span className="font-semibold">{electricUnit}</span> หน่วย
                </p>
                <p>
                  รวมทั้งหมด:{" "}
                  <span className="font-bold text-blue-600">
                    {totalPreview.toLocaleString("th-TH")} บาท
                  </span>
                </p>
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
              >
                {submitting ? "กำลังสร้าง..." : "สร้างบิล"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
