"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import Sidebar from "@/components/sidebar";

type MoveOutStatus = "PENDING_APPROVAL" | "APPROVED" | "REJECTED";

type MoveOutRow = {
  id: string;
  reason: string;
  moveOutDate: string;   // ISO
  createdAt: string;     // ISO
  status: MoveOutStatus;
  room: { id: string | null; roomNumber: string };
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
  };
  unpaidBillsCount: number;
  unpaidBillsTotal: number;
};

type MoveOutListResponse = {
  success: boolean;
  data: MoveOutRow[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export default function AdminMoveOutListPage() {
  const router = useRouter();

  // table state
  const [rows, setRows] = useState<MoveOutRow[]>([]);
  const [loading, setLoading] = useState(true);

  // filters (ตรงกับ API)
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<MoveOutStatus | "">("");
  const [from, setFrom] = useState<string>(""); // yyyy-MM-dd
  const [to, setTo] = useState<string>("");     // yyyy-MM-dd

  // pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [total, setTotal] = useState(0);
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total, pageSize]
  );

  useEffect(() => {
    void fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]); // โหลดครั้งแรก + เวลาเปลี่ยนหน้า/ขนาดหน้า

  const buildQueryString = () => {
    const sp = new URLSearchParams();
    sp.set("page", String(page));
    sp.set("pageSize", String(pageSize));
    if (q.trim()) sp.set("q", q.trim());
    if (status) sp.set("status", status);
    if (from) sp.set("from", new Date(from).toISOString());
    if (to) sp.set("to", new Date(to).toISOString());
    return sp.toString();
  };

  const fetchList = async () => {
    try {
      setLoading(true);
      const qs = buildQueryString();
      const res = await fetch(`/api/admin/moveout?${qs}`, {
        credentials: "include",
        cache: "no-store",
      });

      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e?.error ?? "โหลดข้อมูลไม่สำเร็จ");
      }

      const data: MoveOutListResponse = await res.json();
      if (!data.success) throw new Error("โหลดข้อมูลไม่สำเร็จ");

      setRows(data.data);
      setTotal(data.meta.total);
    } catch (err) {
      console.error("โหลดรายการย้ายออกล้มเหลว:", err);
      toast.error("ไม่สามารถโหลดข้อมูลได้");
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setPage(1);
    await fetchList();
  };

  const fmtDate = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString("th-TH") : "-";
  const fmtBaht = (n: number) => (Number.isFinite(n) ? n.toLocaleString("th-TH") : "0");

  const StatusBadge = ({ s }: { s: MoveOutStatus }) => {
    if (s === "PENDING_APPROVAL") {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 font-semibold text-xs">
          <i className="ri-indeterminate-circle-fill" /> รออนุมัติ
        </span>
      );
    }
    if (s === "APPROVED") {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 font-semibold text-xs">
          <i className="ri-checkbox-circle-fill" /> อนุมัติแล้ว
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 text-red-700 font-semibold text-xs">
        <i className="ri-close-circle-fill" /> ปฏิเสธ
      </span>
    );
  };

  return (
    <div className="flex min-h-screen bg-white text-black">
      <Toaster position="top-right" />
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-200 sticky top-0 h-screen">
        <Sidebar role="admin" />
      </aside>

      {/* Main */}
      <main className="flex-1 p-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#0F3659]">คำร้องขอย้ายออก</h1>
            <p className="text-gray-600 mt-1">จัดการคำร้องขอย้ายออกของผู้เช่า</p>
          </div>
          <div className="text-sm text-gray-600">
            ทั้งหมด: <span className="font-semibold">{total.toLocaleString("th-TH")}</span>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="md:col-span-2">
              <label className="text-xs text-gray-500">ค้นหา (ชื่อ, อีเมล, ห้อง)</label>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="พิมพ์คำค้น..."
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500">สถานะ</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as MoveOutStatus | "")}
                className="w-full px-3 py-2 border rounded-lg bg-white"
              >
                <option value="">ทั้งหมด</option>
                <option value="PENDING_APPROVAL">รออนุมัติ</option>
                <option value="APPROVED">อนุมัติแล้ว</option>
                <option value="REJECTED">ปฏิเสธ</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-500">จากวันที่</label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500">ถึงวันที่</label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-[#0F3659] text-white rounded-lg hover:bg-blue-900 transition"
              >
                ค้นหา
              </button>
              <button
                onClick={() => {
                  setQ("");
                  setStatus("");
                  setFrom("");
                  setTo("");
                  setPage(1);
                  void fetchList();
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
              >
                ล้างตัวกรอง
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">แสดงต่อหน้า</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPage(1);
                  setPageSize(Number(e.target.value));
                }}
                className="px-2 py-1 border rounded-md bg-white"
              >
                {[10, 20, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-gray-500">
            กำลังโหลด...
          </div>
        ) : rows.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-500">
            ไม่พบคำร้องตามเงื่อนไข
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
            <table className="min-w-full table-auto text-sm text-left">
              <thead>
                <tr className="bg-gray-100 text-gray-700">
                  <th className="px-4 py-3">ชื่อ-นามสกุล</th>
                  <th className="px-4 py-3">อีเมล</th>
                  <th className="px-4 py-3">ห้อง</th>
                  <th className="px-4 py-3">เหตุผล</th>
                  <th className="px-4 py-3">วันที่ย้ายออก</th>
                  <th className="px-4 py-3">บิลค้าง</th>
                  <th className="px-4 py-3">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    className="border-t border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/admin/moveout/${r.id}`)}
                  >
                    <td className="px-4 py-3">
                      {r.user.firstName} {r.user.lastName}
                    </td>
                    <td className="px-4 py-3">{r.user.email}</td>
                    <td className="px-4 py-3">{r.room.roomNumber}</td>
                    <td className="px-4 py-3 truncate max-w-[260px]" title={r.reason}>
                      {r.reason}
                    </td>
                    <td className="px-4 py-3">{fmtDate(r.moveOutDate)}</td>
                    <td className="px-4 py-3">
                      {r.unpaidBillsCount > 0 ? (
                        <span className="inline-flex items-center gap-1 text-red-600 font-medium">
                          <i className="ri-error-warning-fill" />
                          {r.unpaidBillsCount} รายการ / {fmtBaht(r.unpaidBillsTotal)} บาท
                        </span>
                      ) : (
                        <span className="text-green-600 font-medium">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge s={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            หน้า {page} / {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-md border disabled:opacity-50 bg-white hover:bg-gray-50"
            >
              ก่อนหน้า
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-md border disabled:opacity-50 bg-white hover:bg-gray-50"
            >
              ถัดไป
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
