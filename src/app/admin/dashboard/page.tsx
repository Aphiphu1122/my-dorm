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

interface DashboardSummary {
  occupancyRate: number;
  vacantRooms: number;
  occupiedRooms: number;
  unpaidRooms: number;
  totalPaid: number;
  totalUnpaid: number;
  monthlyRevenue: { month: string; revenue: number }[];
  maintenanceTrend: {
    month: string;
    PENDING: number;
    IN_PROGRESS: number;
    COMPLETED: number;
    CANCLE: number;
  }[];
  revenueByCategory: {
    month: string;
    rent: number;
    water: number;
    electricity: number;
  }[];
  monthlyPaidUnpaid?: {
    month: string;
    paid: number;
    unpaid: number;
  }[]; // ✅ สำหรับ toggle รายเดือน
}

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
    <div
      className={`rounded-lg p-4 ${bg} shadow flex items-center justify-between`}
    >
      <div>
        <p className="text-sm text-gray-700">{title}</p>
        <p className="text-xl font-bold text-black">{value}</p>
      </div>
      <i className={`${icon} text-3xl text-gray-600`} />
    </div>
  );
}

export default function AdminDashboardPage() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"year" | "month">("year"); // ✅ toggle mode

  useEffect(() => {
    fetchSummary(selectedYear);
  }, [selectedYear]);

  const fetchSummary = async (year: number) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/dashboard/summary?year=${year}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch summary");
      const data: DashboardSummary = await res.json();
      setSummary(data);
    } catch (err) {
      console.error("Dashboard Error:", err);
      toast.error("โหลดข้อมูล dashboard ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white min-h-screen flex">
      <aside className="w-64 border-r border-gray-200 sticky top-0 h-screen">
        <Sidebar role="admin" />
      </aside>

      <main className="flex-1 p-8 max-w-6xl mx-auto">
        <Toaster position="top-right" />
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-[#0F3659]">
            DASHBOARD {selectedYear}
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
            {/* Top stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-10">
              <StatCard
                title="อัตราการเข้าพัก"
                value={`${summary.occupancyRate ?? 0}%`}
                icon="ri-home-heart-fill"
                bg="bg-purple-200"
              />
              <StatCard
                title="ห้องว่าง"
                value={`${summary.vacantRooms ?? 0} ห้อง`}
                icon="ri-building-line"
                bg="bg-yellow-200"
              />
              <StatCard
                title="ห้องที่มีผู้เช่า"
                value={`${summary.occupiedRooms ?? 0} ห้อง`}
                icon="ri-user-line"
                bg="bg-green-200"
              />
              <StatCard
                title="ค้างชำระ"
                value={`${summary.unpaidRooms ?? 0} ห้อง`}
                icon="ri-calendar-close-line"
                bg="bg-red-200"
              />
            </div>

            {/* Rent status + Monthly revenue */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              <div className="bg-white shadow rounded-lg p-6">
                {/* ✅ Toggle switch */}
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">สถานะการชำระค่าเช่า</h3>
                  <div className="flex items-center gap-2">
                    <span
                      className={
                        viewMode === "year" ? "font-bold text-blue-600" : ""
                      }
                    >
                      ปี
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={viewMode === "month"}
                        onChange={() =>
                          setViewMode(viewMode === "year" ? "month" : "year")
                        }
                      />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600"></div>
                      <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition peer-checked:translate-x-5"></div>
                    </label>
                    <span
                      className={
                        viewMode === "month" ? "font-bold text-blue-600" : ""
                      }
                    >
                      เดือน
                    </span>
                  </div>
                </div>

                {/* ✅ Chart */}
                {viewMode === "year" ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Paid", value: summary.totalPaid },
                          { name: "Unpaid", value: summary.totalUnpaid },
                        ]}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        label
                      >
                        <Cell fill="#10b981" />
                        <Cell fill="#facc15" />
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={summary.monthlyPaidUnpaid || []}>
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="paid" fill="#10b981" />
                      <Bar dataKey="unpaid" fill="#facc15" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Monthly revenue */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="font-semibold mb-4">รายได้รวมต่อเดือน</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={summary.monthlyRevenue}>
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="revenue" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Maintenance trend + Revenue by category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="font-semibold mb-4">แนวโน้มการแจ้งซ่อม</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={summary.maintenanceTrend}>
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line dataKey="PENDING" stroke="#f59e0b" />
                    <Line dataKey="IN_PROGRESS" stroke="#3b82f6" />
                    <Line dataKey="COMPLETED" stroke="#10b981" />
                    <Line dataKey="CANCLE" stroke="#ef4444" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="font-semibold mb-4">รายได้แยกตามประเภท</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={summary.revenueByCategory} stackOffset="expand">
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="rent" stackId="a" fill="#3b82f6" />
                    <Bar dataKey="water" stackId="a" fill="#10b981" />
                    <Bar dataKey="electricity" stackId="a" fill="#f59e0b" />
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
