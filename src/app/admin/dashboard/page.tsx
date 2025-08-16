"use client";

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
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import Sidebar from "@/components/sidebar";

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
}

export default function AdminPanel() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const res = await fetch("/api/admin/dashboard/summary", {
        credentials: "include",
      });
      const data: DashboardSummary = await res.json();
      setSummary(data);
    } catch (err) {
      console.error(err);
      toast.error("โหลดข้อมูล dashboard ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  if (loading || !summary) return <div className="p-6">Loading...</div>;

  return (
    <div className="flex min-h-screen">
      {/* ✅ Sidebar ทางซ้าย */}
      <Sidebar role="admin" />

      {/* ✅ เนื้อหา Dashboard */}
      <div className="flex-1 p-6 space-y-10">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">DASHBOARD</h1>

        {/* ✅ Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          <Card title="อัตราการเข้าพัก" value={`${summary.occupancyRate ?? 0}%`} icon="ri-home-heart-fill" bg="bg-purple-200" />
          <Card title="ห้องว่าง" value={`${summary.vacantRooms ?? 0} ห้อง`} icon="ri-building-line" bg="bg-yellow-200" />
          <Card title="ห้องที่มีผู้เช่า" value={`${summary.occupiedRooms ?? 0} ห้อง`} icon="ri-user-line" bg="bg-green-200" />
          <Card title="ค้างชำระ" value={`${summary.unpaidRooms ?? 0} ห้อง`} icon="ri-calendar-close-line" bg="bg-red-200" />
        </div>

        {/* ✅ Pie + Bar Chart */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="font-semibold mb-4">สถานะการชำระค่าเช่า</h3>
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
          </div>

          {/* Bar Chart */}
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

        {/* ✅ Line + Stacked Bar Chart */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Line Chart */}
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

          {/* Stacked Bar Chart */}
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
      </div>
    </div>
  );
}

function Card({
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
    <div className={`rounded-lg p-4 ${bg} shadow flex items-center justify-between`}>
      <div>
        <p className="text-sm text-gray-700">{title}</p>
        <p className="text-xl font-bold text-black">{value}</p>
      </div>
      <i className={`${icon} text-3xl text-gray-600`} />
    </div>
  );
}