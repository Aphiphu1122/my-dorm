"use client";

import { useEffect, useState } from "react";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import Sidebar from "@/components/sidebar";
import "chart.js/auto";

// Register chart components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

type MonthlyRevenue = {
  month: string;
  revenue: number;
};

type MaintenanceTrend = {
  status: string;
  count: number;
};

type SummaryData = {
  occupiedRooms: number;
  vacantRooms: number;
  unpaidRooms: number;
  totalPaid: number;
  totalUnpaid: number;
  monthlyRevenue: MonthlyRevenue[];
  maintenanceTrend: MaintenanceTrend[];
};

export default function AdminReportPage() {
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch("/api/admin/summary");
      const json = await res.json();
      setData(json);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading || !data) return <div className="p-6">Loading...</div>;

  const barChartData = {
    labels: data.monthlyRevenue.map((item: MonthlyRevenue) => item.month),
    datasets: [
      {
        label: "รายรับต่อเดือน (บาท)",
        data: data.monthlyRevenue.map((item: MonthlyRevenue) => item.revenue),
        backgroundColor: "#60a5fa",
      },
    ],
  };

  const pieChartData = {
    labels: ["จ่ายแล้ว", "ค้างชำระ"],
    datasets: [
      {
        label: "สถานะบิล",
        data: [data.totalPaid, data.totalUnpaid],
        backgroundColor: ["#10b981", "#ef4444"],
      },
    ],
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role="admin" />

      <main className="flex-1 p-6 space-y-8 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold">📊 รายงานภาพรวม</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryCard title="ห้องทั้งหมด" value={data.occupiedRooms + data.vacantRooms} />
          <SummaryCard title="ห้องว่าง" value={data.vacantRooms} />
          <SummaryCard title="ห้องมีผู้เช่า" value={data.occupiedRooms} />
          <SummaryCard title="ค้างชำระ" value={data.unpaidRooms} />
        </div>

        {/* Bar Chart */}
        <section className="bg-white rounded shadow p-4">
          <h2 className="font-semibold mb-2">📈 รายรับรายเดือน (6 เดือนล่าสุด)</h2>
          <div className="w-full max-w-[800px] mx-auto">
            <Bar data={barChartData} options={{ responsive: true, maintainAspectRatio: false }} height={300} />
          </div>
        </section>

        {/* Pie Chart */}
        <section className="bg-white rounded shadow p-4">
          <h2 className="font-semibold mb-2">💰 สถานะการชำระบิล</h2>
          <div className="w-full max-w-[400px] mx-auto">
            <Pie data={pieChartData} options={{ responsive: true, maintainAspectRatio: true }} />
          </div>
        </section>

        {/* Maintenance Trend */}
        <section className="bg-white rounded shadow p-4">
          <h2 className="font-semibold mb-2">🛠 รายการแจ้งซ่อมตามสถานะ</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data.maintenanceTrend.map((item) => (
              <SummaryCard
                key={item.status}
                title={translateStatus(item.status)}
                value={item.count}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function SummaryCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="bg-white shadow rounded p-4 text-center">
      <h3 className="text-gray-500 text-sm mb-1">{title}</h3>
      <p className="text-xl font-bold text-blue-700">{value}</p>
    </div>
  );
}

function translateStatus(status: string) {
  switch (status) {
    case "PENDING":
      return "⏳ รอดำเนินการ";
    case "IN_PROGRESS":
      return "🟡 กำลังซ่อม";
    case "COMPLETED":
      return "🟢 เสร็จแล้ว";
    case "CANCLE":
      return "🔴 ยกเลิก";
    default:
      return status;
  }
}
