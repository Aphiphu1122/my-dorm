"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { toast, Toaster } from "react-hot-toast";
import Sidebar from "@/components/sidebar";
import YearSelector from "@/components/YearSelector";

/* ===================== Types & Normalizer (no-any) ===================== */
type MaintTrendRaw = {
  month: string;
  PENDING: number;
  IN_PROGRESS: number;
  COMPLETED: number;
  CANCELED?: number; // รูปแบบใหม่
  CANCLE?: number;   // legacy payload เก่า
};

type MaintTrend = {
  month: string;
  PENDING: number;
  IN_PROGRESS: number;
  COMPLETED: number;
  CANCELED: number;
};

function normalizeMaintenanceTrend(input: unknown): MaintTrend[] {
  if (!Array.isArray(input)) return [];
  return (input as MaintTrendRaw[]).map((m) => ({
    month: m.month,
    PENDING: m.PENDING,
    IN_PROGRESS: m.IN_PROGRESS,
    COMPLETED: m.COMPLETED,
    CANCELED:
      typeof m.CANCELED === "number"
        ? m.CANCELED
        : typeof m.CANCLE === "number"
        ? m.CANCLE
        : 0,
  }));
}

interface DashboardSummary {
  occupancyRate: number;
  vacantRooms: number;
  occupiedRooms: number;
  unpaidRooms: number;
  totalPaid: number;
  totalUnpaid: number;
  monthlyRevenue: { month: string; revenue: number }[];
  revenueByCategory: {
    month: string;
    rent: number;
    water: number;
    electricity: number;
  }[];
  maintenanceTrend: MaintTrend[];
  monthlyPaidUnpaid?: {
    month: string;
    paid: number;
    unpaid: number;
  }[];
  newTenanciesThisYear?: number;
}

/* ============================== UI ============================== */
function StatCard({
  title,
  value,
  icon,
  bg,
}: {
  title: string;
  value: string;
  icon: string;
  bg: string;
}) {
  return (
    <div className={`rounded-xl p-4 ${bg} shadow-sm border border-black/5 flex items-center justify-between`}>
      <div>
        <p className="text-sm text-gray-700">{title}</p>
        <p className="text-xl font-extrabold text-gray-900">{value}</p>
      </div>
      <i className={`${icon} text-3xl text-gray-700`} />
    </div>
  );
}

export default function AdminDashboardPage() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"year" | "month">("year");

  useEffect(() => {
    fetchSummary(selectedYear);
  }, [selectedYear]);

  const fetchSummary = async (year: number) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/dashboard/summary?year=${year}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("โหลดข้อมูลไม่สำเร็จ");

      // รับ payload แบบกว้าง เพื่อ normalize maintenanceTrend
      const raw = (await res.json()) as {
        maintenanceTrend?: unknown;
      } & Omit<DashboardSummary, "maintenanceTrend">;

      const normalizedTrend = normalizeMaintenanceTrend(raw.maintenanceTrend);
      const fixed: DashboardSummary = {
        ...raw,
        maintenanceTrend: normalizedTrend,
      };

      setSummary(fixed);
    } catch (err) {
      console.error("Dashboard Error:", err);
      toast.error("โหลดข้อมูลแดชบอร์ดไม่สำเร็จ");
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const fmtBaht = (n: number) => (n ?? 0).toLocaleString("th-TH");
  const fmtPct = (n: number) =>
    Number.isFinite(n) ? `${n.toFixed(2)}%` : "0.00%";

  return (
    <div className="bg-white min-h-screen flex">
      <aside className="w-64 border-r border-gray-200 sticky top-0 h-screen">
        <Sidebar role="admin" />
      </aside>

      <main className="flex-1 p-8 max-w-6xl mx-auto">
        <Toaster position="top-right" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <h1 className="text-3xl font-extrabold text-[#0F3659]">
            แดชบอร์ดผู้ดูแล {selectedYear}
          </h1>
          <YearSelector selectedYear={selectedYear} onChange={setSelectedYear} />
        </div>

        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-6 w-1/3 bg-gray-200 rounded" />
            <div className="h-32 w-full bg-gray-200 rounded" />
            <div className="h-32 w-3/4 bg-gray-200 rounded" />
            <div className="h-32 w-2/3 bg-gray-200 rounded" />
          </div>
        ) : !summary ? (
          <p className="text-gray-500">ไม่พบข้อมูลสรุป</p>
        ) : (
          <>
            {/* สถิติด้านบน */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
              <StatCard
                title="อัตราการเข้าพัก"
                value={fmtPct(summary.occupancyRate ?? 0)}
                icon="ri-home-heart-fill"
                bg="bg-gradient-to-tr from-violet-200 to-violet-50"
              />
              <StatCard
                title="ห้องว่าง"
                value={`${summary.vacantRooms ?? 0} ห้อง`}
                icon="ri-building-line"
                bg="bg-gradient-to-tr from-amber-200 to-amber-50"
              />
              <StatCard
                title="ห้องที่มีผู้เช่า"
                value={`${summary.occupiedRooms ?? 0} ห้อง`}
                icon="ri-user-3-line"
                bg="bg-gradient-to-tr from-emerald-200 to-emerald-50"
              />
              <StatCard
                title="ค้างชำระ"
                value={`${summary.unpaidRooms ?? 0} ห้อง`}
                icon="ri-calendar-close-line"
                bg="bg-gradient-to-tr from-rose-200 to-rose-50"
              />
              <StatCard
                title="ย้ายเข้าใหม่ (ปีนี้)"
                value={`${summary.newTenanciesThisYear ?? 0} ห้อง`}
                icon="ri-login-circle-line"
                bg="bg-gradient-to-tr from-sky-200 to-sky-50"
              />
            </div>

            {/* สถานะการชำระ & รายได้รวมต่อเดือน */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              {/* สถานะการชำระ */}
              <div className="bg-white shadow rounded-xl p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">สถานะการชำระค่าเช่า</h3>
                  <div className="flex items-center gap-2">
                    <span className={viewMode === "year" ? "font-bold text-blue-600" : ""}>
                      ปี
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={viewMode === "month"}
                        onChange={() => setViewMode((m) => (m === "year" ? "month" : "year"))}
                      />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer-checked:bg-blue-600 transition" />
                      <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition peer-checked:translate-x-5 shadow" />
                    </label>
                    <span className={viewMode === "month" ? "font-bold text-blue-600" : ""}>
                      เดือน
                    </span>
                  </div>
                </div>

                {viewMode === "year" ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: "ชำระแล้ว", value: summary.totalPaid ?? 0 },
                          { name: "ค้างชำระ", value: summary.totalUnpaid ?? 0 },
                        ]}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label
                      >
                        <Cell fill="#10b981" />
                        <Cell fill="#f59e0b" />
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={summary.monthlyPaidUnpaid || []}>
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="paid" fill="#10b981" name="ชำระแล้ว" />
                      <Bar dataKey="unpaid" fill="#f59e0b" name="ค้างชำระ" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* รายได้รวมต่อเดือน */}
              <div className="bg-white shadow rounded-xl p-6 border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-3">รายได้รวมต่อเดือน</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={summary.monthlyRevenue}>
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(v: number) => `${fmtBaht(v)} บาท`} />
                    <Legend />
                    <Bar dataKey="revenue" fill="#3b82f6" name="รายได้" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* แนวโน้มการแจ้งซ่อม & รายได้แยกตามประเภท */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* แนวโน้มแจ้งซ่อม */}
              <div className="bg-white shadow rounded-xl p-6 border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-3">แนวโน้มการแจ้งซ่อม</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={summary.maintenanceTrend}>
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="PENDING" stroke="#f59e0b" name="รอดำเนินการ" />
                    <Line type="monotone" dataKey="IN_PROGRESS" stroke="#3b82f6" name="กำลังดำเนินการ" />
                    <Line type="monotone" dataKey="COMPLETED" stroke="#10b981" name="เสร็จสิ้น" />
                    <Line type="monotone" dataKey="CANCELED" stroke="#ef4444" name="ยกเลิก" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* รายได้แยกตามประเภท */}
              <div className="bg-white shadow rounded-xl p-6 border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-3">รายได้แยกตามประเภท</h3>
                <ResponsiveContainer width="100%" height={260}>
                  {/* stackOffset="expand" = แสดงสัดส่วน (%) ต่อเดือน */}
                  <BarChart data={summary.revenueByCategory} stackOffset="expand">
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(v) => `${Math.round(v * 100)}%`} />
                    <Tooltip formatter={(v: number) => `${Math.round((v ?? 0) * 100)}%`} />
                    <Legend />
                    <Bar dataKey="rent" stackId="a" fill="#3b82f6" name="ค่าเช่า" />
                    <Bar dataKey="water" stackId="a" fill="#10b981" name="ค่าน้ำ" />
                    <Bar dataKey="electricity" stackId="a" fill="#f59e0b" name="ค่าไฟ" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
