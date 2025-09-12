"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation"; // ✅ เพิ่ม useRouter
import Sidebar from "@/components/sidebar";
import Image from "next/image";

interface Contract {
  id: string;
  startDate: string;
  endDate: string;
  rentPerMonth: number;
  contractImages: string[];
  dormOwnerName: string;
  dormAddress: string;
  contractDate: string;
}

interface TenantDetail {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthday: string;
  address: string;
  nationalId: string;
  userId: string;
  role: string;
  isActive: boolean;
  roomNumber: string | null;
  status: string | null;
  roomStartDate: string | null;
  assignedAt: string | null;
  contractStartDate: string | null;
  contractEndDate: string | null;
  rentPerMonth: number | null;
  contractId: string | null;
  contractImages: string[];
  contracts: Contract[];
}

export default function TenantDetailPage() {
  const params = useParams();
  const router = useRouter(); // ✅
  const id = params?.id as string;

  const [tenant, setTenant] = useState<TenantDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTenant = async () => {
      try {
        const res = await fetch(`/api/admin/tenants/${id}`, {
          credentials: "include",
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setTenant(data.user);
        } else {
          console.error("โหลดข้อมูลไม่สำเร็จ:", data?.error ?? res.statusText);
          setTenant(null);
        }
      } catch (err) {
        console.error("เกิดข้อผิดพลาด:", err);
        setTenant(null);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchTenant();
  }, [id]);

  const toThaiDate = (iso?: string | null) => {
    if (!iso) return "-";
    const t = new Date(iso);
    return isNaN(t.getTime())
      ? "-"
      : t.toLocaleDateString("th-TH", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-white">
        <aside className="w-64 border-r border-gray-200 sticky top-0 h-screen">
          <Sidebar role="admin" />
        </aside>
        <main className="flex-1 p-8">
          <div className="animate-pulse">กำลังโหลดข้อมูล...</div>
        </main>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="flex min-h-screen bg-white">
        <aside className="w-64 border-r border-gray-200 sticky top-0 h-screen">
          <Sidebar role="admin" />
        </aside>
        <main className="flex-1 p-8">
          <div className="text-red-500">ไม่พบข้อมูลผู้เช่า</div>
          {/* ปุ่มย้อนกลับ */}
          <div className="mt-6">
            <button
              onClick={() => router.back()}
              className="px-6 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition"
            >
              ย้อนกลับ
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white">
      <aside className="w-64 border-r border-gray-200 sticky top-0 h-screen">
        <Sidebar role="admin" />
      </aside>

      <main className="flex-1 p-8 max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-[#0F3659] mb-4">
          ข้อมูลส่วนตัวผู้เช่า
        </h1>

        {/* ข้อมูลผู้เช่า */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            ข้อมูลผู้เช่า
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-700">
            <div>
              <span className="font-semibold">ชื่อ–นามสกุล:</span>{" "}
              {tenant.firstName} {tenant.lastName}
            </div>
            <div>
              <span className="font-semibold">Email:</span> {tenant.email}
            </div>
            <div>
              <span className="font-semibold">เบอร์โทร:</span> {tenant.phone}
            </div>
            <div>
              <span className="font-semibold">วันเกิด:</span>{" "}
              {toThaiDate(tenant.birthday)}
            </div>
            <div>
              <span className="font-semibold">เลขบัตร ปชช.:</span>{" "}
              {tenant.nationalId}
            </div>
            <div>
              <span className="font-semibold">User ID:</span> {tenant.userId}
            </div>
            <div>
              <span className="font-semibold">สถานะ:</span>{" "}
              {tenant.isActive ? "ใช้งานอยู่" : "ปิดการใช้งาน"}
            </div>
          </div>
        </div>

        {/* ข้อมูลห้อง */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            ข้อมูลห้องพัก
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-700">
            <div>
              <span className="font-semibold">เลขห้อง:</span>{" "}
              {tenant.roomNumber ?? "-"}
            </div>
            <div>
              <span className="font-semibold">สถานะห้อง:</span>{" "}
              {tenant.status ?? "-"}
            </div>
            <div>
              <span className="font-semibold">วันที่เริ่มเช่า:</span>{" "}
              {toThaiDate(tenant.roomStartDate)}
            </div>
            <div>
              <span className="font-semibold">Assigned At:</span>{" "}
              {toThaiDate(tenant.assignedAt)}
            </div>
          </div>
        </div>

        {/* สัญญาล่าสุด */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            สัญญาล่าสุด
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-700">
            <div>
              <span className="font-semibold">วันที่ทำสัญญา:</span>{" "}
              {toThaiDate(tenant.contracts[0]?.contractDate)}
            </div>
            <div>
              <span className="font-semibold">วันที่เริ่มสัญญา:</span>{" "}
              {toThaiDate(tenant.contractStartDate)}
            </div>
            <div>
              <span className="font-semibold">วันที่สิ้นสุดสัญญา:</span>{" "}
              {toThaiDate(tenant.contractEndDate)}
            </div>
            <div>
              <span className="font-semibold">ค่าเช่ารายเดือน:</span>{" "}
              {tenant.rentPerMonth
                ? tenant.rentPerMonth.toLocaleString()
                : "-"}
            </div>
            <div>
              <span className="font-semibold">ที่อยู่หอพัก:</span>{" "}
              {tenant.contracts[0]?.dormAddress ?? "-"}
            </div>
            <div>
              <span className="font-semibold">ชื่อผู้ให้เช่า:</span>{" "}
              {tenant.contracts[0]?.dormOwnerName ?? "-"}
            </div>
          </div>

          {/* รูปภาพสัญญา */}
          <div className="mt-4">
            <h3 className="font-semibold text-gray-800 mb-2">
              รูปภาพสัญญา (ล่าสุด)
            </h3>
            <div className="flex flex-wrap gap-3">
              {tenant.contractImages?.length > 0 ? (
                tenant.contractImages.map((url, idx) => (
                  <Image
                    key={idx}
                    src={url}
                    alt={`Contract ${idx + 1}`}
                    className="w-40 h-40 object-cover rounded border"
                  />
                ))
              ) : (
                <p className="text-gray-500">ไม่มีรูปสัญญา</p>
              )}
            </div>
          </div>
        </div>

        {/* สัญญาทั้งหมด */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            สัญญาทั้งหมด
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">วันที่เริ่ม</th>
                  <th className="px-4 py-2 text-left">วันที่สิ้นสุด</th>
                  <th className="px-4 py-2 text-left">ค่าเช่า</th>
                  <th className="px-4 py-2 text-left">จำนวนรูป</th>
                </tr>
              </thead>
              <tbody>
                {tenant.contracts.length > 0 ? (
                  tenant.contracts.map((c) => (
                    <tr key={c.id} className="border-t">
                      <td className="px-4 py-2">{toThaiDate(c.startDate)}</td>
                      <td className="px-4 py-2">{toThaiDate(c.endDate)}</td>
                      <td className="px-4 py-2">
                        {c.rentPerMonth.toLocaleString()}
                      </td>
                      <td className="px-4 py-2">{c.contractImages.length}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-2 text-center text-gray-500"
                    >
                      ไม่มีข้อมูลสัญญา
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ✅ ปุ่มย้อนกลับ */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => router.back()}
            className="px-6 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition"
          >
            ย้อนกลับ
          </button>
        </div>
      </main>
    </div>
  );
}
