"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Sidebar from "@/components/sidebar";
import Image from "next/image";

type RoomStatus = "AVAILABLE" | "OCCUPIED" | "MAINTENANCE";

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

  // room
  roomNumber: string | null;
  status: RoomStatus | null;
  roomStartDate: string | null;
  assignedAt: string | null;

  // latest contract (flattened)
  contractStartDate: string | null;
  contractEndDate: string | null;
  rentPerMonth: number | null;
  contractId: string | null;
  contractImages: string[];

  // all contracts
  contracts: Contract[];
}

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

export default function TenantDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [tenant, setTenant] = useState<TenantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // -------- Lightbox states --------
  const [isViewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const openViewer = (idx: number) => {
    setViewerIndex(idx);
    setViewerOpen(true);
  };
  const closeViewer = () => setViewerOpen(false);

  const nextImg = useCallback((imgs: string[]) => {
    if (!imgs.length) return;
    setViewerIndex((i) => (i + 1) % imgs.length);
  }, []);

  const prevImg = useCallback((imgs: string[]) => {
    if (!imgs.length) return;
    setViewerIndex((i) => (i - 1 + imgs.length) % imgs.length);
  }, []);

  // โหลดข้อมูลผู้เช่า
  useEffect(() => {
    const fetchTenant = async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch(`/api/admin/tenants/${id}`, {
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok || !data?.success) {
          throw new Error(data?.error || "โหลดข้อมูลไม่สำเร็จ");
        }
        setTenant(data.user as TenantDetail);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
        setTenant(null);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchTenant();
  }, [id]);

  // รวมรูปภาพล่าสุด (top-level ถ้าไม่มีให้ใช้สัญญาแรก)
  const latestImages = useMemo<string[]>(() => {
    if (!tenant) return [];
    return (tenant.contractImages?.length
      ? tenant.contractImages
      : tenant.contracts?.[0]?.contractImages) ?? [];
  }, [tenant]);

  // ใช้ useRef เก็บรายการรูป เพื่อให้ keyboard handler เข้าถึงค่า "ล่าสุด" ได้
  const latestImagesRef = useRef<string[]>([]);
  useEffect(() => {
    latestImagesRef.current = latestImages;
  }, [latestImages]);

  // keyboard support for lightbox (ไม่มี dependency เตือนแล้ว)
  useEffect(() => {
    if (!isViewerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeViewer();
      if (e.key === "ArrowRight") {
        const imgs = latestImagesRef.current;
        if (imgs.length) nextImg(imgs);
      }
      if (e.key === "ArrowLeft") {
        const imgs = latestImagesRef.current;
        if (imgs.length) prevImg(imgs);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isViewerOpen, nextImg, prevImg]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-white">
        <aside className="w-64 border-r border-gray-200 sticky top-0 h-screen">
          <Sidebar role="admin" />
        </aside>
        <main className="flex-1 p-8">
          <div className="bg-white rounded-2xl shadow p-6 animate-pulse">
            กำลังโหลดข้อมูล...
          </div>
        </main>
      </div>
    );
  }

  if (err || !tenant) {
    return (
      <div className="flex min-h-screen bg-white">
        <aside className="w-64 border-r border-gray-200 sticky top-0 h-screen">
          <Sidebar role="admin" />
        </aside>
        <main className="flex-1 p-8">
          <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl p-4">
            {err ?? "ไม่พบข้อมูลผู้เช่า"}
          </div>
          <div className="mt-6">
            <button
              onClick={() => router.back()}
              className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
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

      <main className="flex-1 p-8 max-w-6xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-[#0F3659]">ข้อมูลส่วนตัวผู้เช่า</h1>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 rounded-lg border text-slate-700 hover:bg-slate-50"
          >
            ← ย้อนกลับ
          </button>
        </div>

        {/* --- Profile --- */}
        <section className="bg-white rounded-2xl shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">ข้อมูลผู้เช่า</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-700">
            <div><span className="font-semibold">ชื่อ–นามสกุล:</span> {tenant.firstName} {tenant.lastName}</div>
            <div><span className="font-semibold">อีเมล:</span> {tenant.email}</div>
            <div><span className="font-semibold">เบอร์โทร:</span> {tenant.phone}</div>
            <div><span className="font-semibold">วันเกิด:</span> {toThaiDate(tenant.birthday)}</div>
            <div><span className="font-semibold">เลขบัตร ปชช.:</span> {tenant.nationalId}</div>
            <div><span className="font-semibold">User ID:</span> {tenant.userId}</div>
            <div><span className="font-semibold">สถานะบัญชี:</span> {tenant.isActive ? "ใช้งานอยู่" : "ปิดการใช้งาน"}</div>
          </div>
        </section>

        {/* --- Room --- */}
        <section className="bg-white rounded-2xl shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">ข้อมูลห้องพัก</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-700">
            <div><span className="font-semibold">เลขห้อง:</span> {tenant.roomNumber ?? "-"}</div>
            <div><span className="font-semibold">สถานะห้อง:</span> {tenant.status ?? "-"}</div>
            <div><span className="font-semibold">วันที่เริ่มเช่า:</span> {toThaiDate(tenant.roomStartDate)}</div>
            <div><span className="font-semibold">Assigned At:</span> {toThaiDate(tenant.assignedAt)}</div>
          </div>
        </section>

        {/* --- Latest Contract --- */}
        <section className="bg-white rounded-2xl shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">สัญญาล่าสุด</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-700">
            <div><span className="font-semibold">วันที่ทำสัญญา:</span> {toThaiDate(tenant.contracts?.[0]?.contractDate)}</div>
            <div><span className="font-semibold">วันที่เริ่มสัญญา:</span> {toThaiDate(tenant.contractStartDate)}</div>
            <div><span className="font-semibold">วันที่สิ้นสุดสัญญา:</span> {toThaiDate(tenant.contractEndDate)}</div>
            <div><span className="font-semibold">ค่าเช่ารายเดือน:</span> {tenant.rentPerMonth ? tenant.rentPerMonth.toLocaleString() : "-"}</div>
            <div><span className="font-semibold">ชื่อผู้ให้เช่า:</span> {tenant.contracts?.[0]?.dormOwnerName ?? "-"}</div>
            <div><span className="font-semibold">ที่อยู่หอพัก:</span> {tenant.contracts?.[0]?.dormAddress ?? "-"}</div>
          </div>

          {/* รูปภาพสัญญา (คลิกเพื่อดูเต็มจอ) */}
          <div className="mt-4">
            <h3 className="font-semibold text-gray-800 mb-2">รูปภาพสัญญา</h3>
            {latestImages.length ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {latestImages.map((src, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => openViewer(idx)}
                    className="relative w-full aspect-[4/3] overflow-hidden rounded border group"
                    title="คลิกเพื่อขยาย"
                  >
                    <Image
                      src={src}
                      alt={`contract-${idx + 1}`}
                      fill
                      className="object-cover transition group-hover:scale-[1.03]"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                      priority={idx === 0}
                    />
                    <span className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition" />
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">ไม่มีรูปสัญญา</p>
            )}
          </div>
        </section>

        {/* --- All Contracts --- */}
        <section className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">สัญญาทั้งหมด</h2>
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
                {tenant.contracts?.length ? (
                  tenant.contracts.map((c) => (
                    <tr key={c.id} className="border-t">
                      <td className="px-4 py-2">{toThaiDate(c.startDate)}</td>
                      <td className="px-4 py-2">{toThaiDate(c.endDate)}</td>
                      <td className="px-4 py-2">{c.rentPerMonth.toLocaleString()}</td>
                      <td className="px-4 py-2">{c.contractImages.length}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-center text-gray-500">
                      ไม่มีข้อมูลสัญญา
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* -------- Lightbox / Viewer -------- */}
      {isViewerOpen && latestImages.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center"
          onClick={closeViewer}
          role="dialog"
          aria-modal="true"
        >
          {/* ปุ่มปิด */}
          <button
            onClick={closeViewer}
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white inline-flex items-center justify-center"
            title="ปิด (Esc)"
          >
            ✕
          </button>

          {/* ปุ่มก่อนหน้า/ถัดไป */}
          {latestImages.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevImg(latestImagesRef.current);
                }}
                className="absolute left-3 sm:left-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white"
                title="ก่อนหน้า (←)"
              >
                ◀
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextImg(latestImagesRef.current);
                }}
                className="absolute right-3 sm:right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white"
                title="ถัดไป (→)"
              >
                ▶
              </button>
            </>
          )}

          {/* กล่องภาพใหญ่ */}
          <div
            className="relative w-[92vw] h-[78vh] sm:w-[86vw] sm:h-[82vh] max-w-6xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={latestImages[viewerIndex]}
              alt={`contract-large-${viewerIndex + 1}`}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>

          {/* แถบ thumbnail */}
          {latestImages.length > 1 && (
            <div
              className="absolute bottom-3 left-0 right-0 mx-auto flex gap-2 px-3 justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              {latestImages.map((thumb, i) => (
                <button
                  key={i}
                  onClick={() => setViewerIndex(i)}
                  className={`relative w-16 h-12 sm:w-20 sm:h-14 rounded overflow-hidden border ${
                    viewerIndex === i
                      ? "border-white"
                      : "border-white/30 hover:border-white/60"
                  }`}
                  title={`รูปที่ ${i + 1}`}
                >
                  <Image
                    src={thumb}
                    alt={`thumb-${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="10vw"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
