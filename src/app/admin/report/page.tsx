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
 
  const barChartData = {
    labels: data?.monthlyRevenue.map((item: MonthlyRevenue) => item.month) || [],
    datasets: [
      {
        label: "รายรับต่อเดือน (บาท)",
        data: data?.monthlyRevenue.map((item: MonthlyRevenue) => item.revenue) || [],
        backgroundColor: "#60a5fa",
      },
    ],
  };
 
  const pieChartData = {
    labels: ["จ่ายแล้ว", "ค้างชำระ"],
    datasets: [
      {
        label: "สถานะบิล",
        data: [data?.totalPaid || 0, data?.totalUnpaid || 0],
        backgroundColor: ["#10b981", "#ef4444"],
      },
    ],
  };
 
  return (
    <div className="flex min-h-screen bg-white">
      <aside className="w-64 border-r border-gray-200 sticky top-0 h-screen">
        <Sidebar role="admin" />
      </aside>
 
      {/* Main content */}
      <main className="flex-1 p-4 max-w-5xl mx-auto mt-5">
            <div>
              <h1 className="text-3xl font-bold text-[#0F3659]">Report</h1>
              <p className="text-gray-600 mt-1">
                Summary of income, bill status, room repair notification according to status
              </p>
            </div>
             {loading || !data ? (
          <div className="flex items-center justify-center h-full text-gray-500 text-lg">
            Loading...
          </div>
        ) : (
          <>
 
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
              <div className="w-full max-w-[800px] mx-auto h-80">
                <Bar
                  data={barChartData}
                  options={{ responsive: true, maintainAspectRatio: false }}
                />
              </div>
            </section>
 
            {/* Pie Chart */}
            <section className="bg-white rounded shadow p-4">
              <h2 className="font-semibold mb-2">💰 สถานะการชำระบิล</h2>
              <div className="w-full max-w-[400px] mx-auto h-80">
                <Pie
                  data={pieChartData}
                  options={{ responsive: true, maintainAspectRatio: true }}
                />
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
          </>
        )}
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