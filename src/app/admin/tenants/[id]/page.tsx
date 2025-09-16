"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Sidebar from "@/components/sidebar";
import Image from "next/image";
import { Toaster, toast } from "react-hot-toast";

// -------- Types --------
type RoomStatus = "AVAILABLE" | "OCCUPIED" | "MAINTENANCE";

interface Contract {
  id: string;
  startDate: string;       // ISO
  endDate: string;         // ISO
  rentPerMonth: number;
  contractImages: string[];
  dormOwnerName: string;
  dormAddress: string;
  contractDate: string;    // ISO
}

interface TenantDetail {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthday: string;        // ISO
  address: string;
  nationalId: string;
  userId: string;
  role: string;
  isActive: boolean;

  // room
  roomId?: string | null;
  roomNumber: string | null;
  status: RoomStatus | null;
  roomStartDate: string | null;   // วันที่เข้าพักจริง
  assignedAt: string | null;      // วันที่จัดสรรห้อง (Assigned At)

  // ลดรูปสัญญาล่าสุด (เพื่อความเข้ากันได้ของ API เดิม)
  contractStartDate: string | null;
  contractEndDate: string | null;
  rentPerMonth: number | null;
  contractId: string | null;
  contractImages: string[];

  // สัญญาทั้งหมด
  contracts: Contract[];
}

// -------- Utils --------
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

const onlyDate = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addOneYear = (d: Date) => {
  const nd = new Date(d);
  nd.setFullYear(nd.getFullYear() + 1);
  return nd;
};

// ======== Page ========
export default function TenantDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [tenant, setTenant] = useState<TenantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // --- Edit latest contract ---
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<{
    contractDate: string;
    startDate: string;
    endDate: string;
    rentPerMonth: string;
    dormOwnerName: string;
    dormAddress: string;
    contractImages: string[];
  } | null>(null);

  // --- Add renewal contract ---
  const [showRenew, setShowRenew] = useState(false);
  const [renewForm, setRenewForm] = useState<{
    contractDate: string;
    startDate: string;
    endDate: string;
    rentPerMonth: string;
    contractImages: string[];
    dormOwnerName: string;
    dormAddress: string;
  } | null>(null);

  // --- upload states (ใช้ร่วม edit/renew) ---
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  // --- Lightbox states ---
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

  // ------- Load tenant -------
  const fetchTenant = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/tenants/${id}`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.error || "โหลดข้อมูลไม่สำเร็จ");
      setTenant(data.user as TenantDetail);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
      setTenant(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchTenant();
  }, [id, fetchTenant]);

  // -------- sort contracts --------
  const sortedContracts = useMemo<Contract[]>(() => {
    if (!tenant?.contracts) return [];
    // เรียงจากเก่า -> ใหม่
    return [...tenant.contracts].sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
  }, [tenant]);

  const initialContract = sortedContracts[0] || null;
  const latestContract = sortedContracts[sortedContracts.length - 1] || null;

  // รวมรูปไว้โชว์ (เอารูปจากสัญญาล่าสุดก่อน, ถ้าไม่มีค่อยใช้สัญญาตั้งต้น)
  const previewImages = useMemo<string[]>(() => {
    if (!latestContract && !initialContract) return [];
    return (latestContract?.contractImages?.length
      ? latestContract.contractImages
      : initialContract?.contractImages) || [];
  }, [latestContract, initialContract]);

  // keyboard support for lightbox
  const imagesRef = useRef<string[]>([]);
  useEffect(() => {
    imagesRef.current = previewImages;
  }, [previewImages]);

  useEffect(() => {
    if (!isViewerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeViewer();
      if (e.key === "ArrowRight") nextImg(imagesRef.current);
      if (e.key === "ArrowLeft") prevImg(imagesRef.current);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isViewerOpen, nextImg, prevImg]);

  // ------ Edit setup ------
  const beginEdit = () => {
    if (!latestContract) return;
    setEditForm({
      contractDate: latestContract.contractDate?.slice(0, 10) ?? "",
      startDate: latestContract.startDate?.slice(0, 10) ?? "",
      endDate: latestContract.endDate?.slice(0, 10) ?? "",
      rentPerMonth: String(latestContract.rentPerMonth ?? ""),
      dormOwnerName: latestContract.dormOwnerName ?? "",
      dormAddress: latestContract.dormAddress ?? "",
      contractImages: [...(latestContract.contractImages || [])],
    });
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditForm(null);
    setSelectedFiles([]);
  };

  // ------ Renew setup ------
  const canRenew = useMemo(() => {
    if (!latestContract) return false;
    const end = onlyDate(new Date(latestContract.endDate));
    const today = onlyDate(new Date());
    return end <= today;
  }, [latestContract]);

  const beginRenew = () => {
    if (!latestContract || !tenant) return;
    const lastEnd = new Date(latestContract.endDate);
    const defaultStart = new Date(lastEnd);
    defaultStart.setDate(defaultStart.getDate() + 1); // วันถัดจากวันสิ้นสุด

    const defaultEnd = addOneYear(defaultStart);
    setRenewForm({
      contractDate: new Date().toISOString().slice(0, 10),
      startDate: defaultStart.toISOString().slice(0, 10),
      endDate: defaultEnd.toISOString().slice(0, 10),
      rentPerMonth: String(latestContract.rentPerMonth ?? ""),
      dormOwnerName: latestContract.dormOwnerName ?? "",
      dormAddress: latestContract.dormAddress ?? "",
      contractImages: [],
    });
    setShowRenew(true);
  };

  const cancelRenew = () => {
    setShowRenew(false);
    setRenewForm(null);
    setSelectedFiles([]);
  };

  // ------ Upload helper (ใช้ได้ทั้ง edit/renew) ------
  const onChooseFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fs = Array.from(e.target.files ?? []);
    setSelectedFiles(fs.slice(0, 10));
  };

  const uploadSelected = async (mode: "edit" | "renew") => {
    if (!selectedFiles.length) {
      toast.error("กรุณาเลือกไฟล์ก่อน");
      return;
    }
    try {
      setUploading(true);
      const fd = new FormData();
      selectedFiles.forEach((f) => fd.append("files", f));
      const res = await fetch("/api/admin/uploads/contract", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "อัปโหลดไม่สำเร็จ");

      const urls: string[] = Array.isArray(data?.urls) ? data.urls.filter(Boolean) : [];
      if (!urls.length) {
        toast("ไม่ได้รับ URL กลับมา", { icon: "⚠️" });
      }
      if (mode === "edit" && editForm) {
        setEditForm({ ...editForm, contractImages: [...editForm.contractImages, ...urls].slice(0, 10) });
      }
      if (mode === "renew" && renewForm) {
        setRenewForm({ ...renewForm, contractImages: [...renewForm.contractImages, ...urls].slice(0, 10) });
      }
      setSelectedFiles([]);
      toast.success("อัปโหลดสำเร็จ");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const removeImageAt = (mode: "edit" | "renew", idx: number) => {
    if (mode === "edit" && editForm) {
      const next = [...editForm.contractImages];
      next.splice(idx, 1);
      setEditForm({ ...editForm, contractImages: next });
    }
    if (mode === "renew" && renewForm) {
      const next = [...renewForm.contractImages];
      next.splice(idx, 1);
      setRenewForm({ ...renewForm, contractImages: next });
    }
  };

  // ------ Save edit latest contract ------
  const saveEdit = async () => {
    if (!tenant?.contractId || !editForm) return;
    const start = new Date(editForm.startDate);
    const end = new Date(editForm.endDate);
    if (!(start < end)) {
      toast.error("วันสิ้นสุดต้องหลังวันเริ่ม");
      return;
    }
    try {
      const res = await fetch(`/api/admin/contracts/${tenant.contractId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          contractDate: new Date(editForm.contractDate),
          startDate: start,
          endDate: end,
          rentPerMonth: Number(editForm.rentPerMonth),
          dormOwnerName: editForm.dormOwnerName.trim(),
          dormAddress: editForm.dormAddress.trim(),
          contractImages: editForm.contractImages,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.error || "บันทึกไม่สำเร็จ");
      toast.success("บันทึกสัญญาล่าสุดเรียบร้อย");
      setIsEditing(false);
      setEditForm(null);
      await fetchTenant();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  // ------ Create renewal contract ------
  const saveRenew = async () => {
    if (!tenant?.id || !tenant?.roomId || !renewForm) return;
    const start = new Date(renewForm.startDate);
    const end = new Date(renewForm.endDate);
    if (!(start < end)) {
      toast.error("วันสิ้นสุดต้องหลังวันเริ่ม");
      return;
    }
    // ตรวจไม่ให้เริ่มก่อนวันสิ้นสุดสัญญาเก่า
    if (latestContract) {
      const lastEnd = onlyDate(new Date(latestContract.endDate));
      const newStart = onlyDate(start);
      if (newStart <= lastEnd) {
        toast.error("วันเริ่มสัญญาใหม่ต้องหลังวันสิ้นสุดสัญญาเดิม");
        return;
      }
    }

    try {
      const res = await fetch(`/api/admin/contracts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          profileId: tenant.id,
          roomId: tenant.roomId,
          contractDate: new Date(renewForm.contractDate),
          startDate: start,
          endDate: end,
          rentPerMonth: Number(renewForm.rentPerMonth),
          dormOwnerName: renewForm.dormOwnerName.trim(),
          dormAddress: renewForm.dormAddress.trim(),
          contractImages: renewForm.contractImages,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.error || "สร้างสัญญาใหม่ไม่สำเร็จ");
      toast.success("สร้างสัญญาเช่าต่อเรียบร้อย");
      setShowRenew(false);
      setRenewForm(null);
      await fetchTenant();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  // ======== Rendering ========
  if (loading) {
    return (
      <div className="flex min-h-screen bg-white">
        <aside className="w-64 border-r border-gray-200 sticky top-0 h-screen">
          <Sidebar role="admin" />
        </aside>
        <main className="flex-1 p-8">
          <div className="bg-white rounded-2xl shadow p-6 animate-pulse">กำลังโหลดข้อมูล...</div>
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
              className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
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
      <Toaster position="top-right" />
      <aside className="w-64 border-r border-gray-200 sticky top-0 h-screen">
        <Sidebar role="admin" />
      </aside>

      <main className="flex-1 p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-[#0F3659]">ข้อมูลผู้เช่า</h1>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 rounded-lg border text-slate-700 hover:bg-slate-50"
          >
            ← ย้อนกลับ
          </button>
        </div>

        {/* Profile */}
        <section className="bg-white rounded-2xl shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">ข้อมูลส่วนตัว</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-700">
            <div><span className="font-semibold">ชื่อ–นามสกุล:</span> {tenant.firstName} {tenant.lastName}</div>
            <div><span className="font-semibold">อีเมล:</span> {tenant.email}</div>
            <div><span className="font-semibold">เบอร์โทร:</span> {tenant.phone}</div>
            <div><span className="font-semibold">วันเกิด:</span> {toThaiDate(tenant.birthday)}</div>
            <div><span className="font-semibold">เลขบัตร ปชช.:</span> {tenant.nationalId}</div>
            <div><span className="font-semibold">รหัสผู้ใช้:</span> {tenant.userId}</div>
            <div><span className="font-semibold">สถานะบัญชี:</span> {tenant.isActive ? "ใช้งานอยู่" : "ย้ายออก"}</div>
          </div>
        </section>

        {/* Room */}
        <section className="bg-white rounded-2xl shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">ข้อมูลห้องพัก</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-700">
            <div><span className="font-semibold">เลขห้อง:</span> {tenant.roomNumber ?? "-"}</div>
            <div><span className="font-semibold">สถานะห้อง:</span> {tenant.status ?? "-"}</div>
            <div><span className="font-semibold">วันที่เข้าพัก:</span> {toThaiDate(tenant.roomStartDate)}</div>
            <div>
              <span className="font-semibold">วันที่จัดสรรห้อง:</span>{" "}
              {toThaiDate(tenant.assignedAt)}
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            * “วันที่จัดสรรห้อง” คือวันที่ระบบ/ผู้ดูแลทำการมอบหมายห้องให้ผู้เช่า (Assigned At)
          </p>
        </section>

        {/* Initial Contract Card */}
        <section className="bg-white rounded-2xl shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold text-gray-900">
              สัญญาตั้งต้น {initialContract ? "" : "(ไม่มีข้อมูล)"}
            </h2>
            <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              ครั้งแรกที่เข้าพัก
            </span>
          </div>
          {initialContract ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-700">
                <div><span className="font-semibold">วันที่ทำสัญญา:</span> {toThaiDate(initialContract.contractDate)}</div>
                <div><span className="font-semibold">วันที่เริ่มสัญญา:</span> {toThaiDate(initialContract.startDate)}</div>
                <div><span className="font-semibold">วันที่สิ้นสุดสัญญา:</span> {toThaiDate(initialContract.endDate)}</div>
                <div><span className="font-semibold">ค่าเช่ารายเดือน:</span> {initialContract.rentPerMonth.toLocaleString()} บาท</div>
                <div><span className="font-semibold">ชื่อผู้ให้เช่า:</span> {initialContract.dormOwnerName}</div>
                <div><span className="font-semibold">ที่อยู่หอพัก:</span> {initialContract.dormAddress}</div>
              </div>
            </>
          ) : (
            <p className="text-gray-500">—</p>
          )}
        </section>

        {/* Latest Contract (editable) */}
        <section className="bg-white rounded-2xl shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold text-gray-900">
              {sortedContracts.length > 1 ? `สัญญาเช่าต่อ ครั้งที่ ${sortedContracts.length - 0 /*นับรวมตั้งต้น*/ - 0}` : "สัญญาล่าสุด"}
            </h2>

            <div className="flex items-center gap-2">
              <button
                className={`px-3 py-1.5 rounded-lg border ${canRenew ? "border-emerald-300 text-emerald-700 hover:bg-emerald-50" : "border-slate-200 text-slate-400 cursor-not-allowed"}`}
                onClick={canRenew ? beginRenew : undefined}
                title={canRenew ? "เพิ่มสัญญาเช่าต่อ" : "กดได้เมื่อสัญญาล่าสุดหมดอายุแล้ว"}
              >
                + เพิ่มสัญญาเช่าต่อ
              </button>

              {!isEditing ? (
                <button
                  className="px-3 py-1.5 rounded-lg border border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                  onClick={beginEdit}
                  disabled={!latestContract}
                >
                  แก้ไขสัญญาล่าสุด
                </button>
              ) : (
                <>
                  <button
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                    onClick={cancelEdit}
                  >
                    ยกเลิก
                  </button>
                  <button
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                    onClick={saveEdit}
                  >
                    บันทึก
                  </button>
                </>
              )}
            </div>
          </div>

          {/* view / edit form */}
          {!isEditing && latestContract && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-700">
                <div><span className="font-semibold">วันที่ทำสัญญา:</span> {toThaiDate(latestContract.contractDate)}</div>
                <div><span className="font-semibold">วันที่เริ่มสัญญา:</span> {toThaiDate(latestContract.startDate)}</div>
                <div><span className="font-semibold">วันที่สิ้นสุดสัญญา:</span> {toThaiDate(latestContract.endDate)}</div>
                <div><span className="font-semibold">ค่าเช่ารายเดือน:</span> {latestContract.rentPerMonth.toLocaleString()} บาท</div>
                <div><span className="font-semibold">ชื่อผู้ให้เช่า:</span> {latestContract.dormOwnerName}</div>
                <div><span className="font-semibold">ที่อยู่หอพัก:</span> {latestContract.dormAddress}</div>
              </div>

              <div className="mt-4">
                <h3 className="font-semibold text-gray-800 mb-2">รูปภาพสัญญา</h3>
                {previewImages.length ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {previewImages.map((src, idx) => (
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
            </>
          )}

          {isEditing && editForm && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">วันที่ทำสัญญา</label>
                  <input
                    type="date"
                    className="border border-slate-300 rounded-lg px-3 py-2 w-full"
                    value={editForm.contractDate}
                    onChange={(e) => setEditForm({ ...editForm, contractDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">วันที่เริ่มสัญญา</label>
                  <input
                    type="date"
                    className="border border-slate-300 rounded-lg px-3 py-2 w-full"
                    value={editForm.startDate}
                    onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">วันที่สิ้นสุดสัญญา</label>
                  <input
                    type="date"
                    className="border border-slate-300 rounded-lg px-3 py-2 w-full"
                    value={editForm.endDate}
                    onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">ค่าเช่ารายเดือน (บาท)</label>
                  <input
                    type="number"
                    min={0}
                    className="border border-slate-300 rounded-lg px-3 py-2 w-full"
                    value={editForm.rentPerMonth}
                    onChange={(e) => setEditForm({ ...editForm, rentPerMonth: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-1">
                  <label className="text-sm font-medium text-slate-700 mb-1 block">ชื่อผู้ให้เช่า</label>
                  <input
                    className="border border-slate-300 rounded-lg px-3 py-2 w-full"
                    value={editForm.dormOwnerName}
                    onChange={(e) => setEditForm({ ...editForm, dormOwnerName: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-slate-700 mb-1 block">ที่อยู่หอพัก</label>
                  <input
                    className="border border-slate-300 rounded-lg px-3 py-2 w-full"
                    value={editForm.dormAddress}
                    onChange={(e) => setEditForm({ ...editForm, dormAddress: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 block">เพิ่ม/แก้ไขรูปสัญญา (สูงสุด 10)</label>
                <div className="mt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <input type="file" accept="image/*" multiple onChange={onChooseFiles}
                    className="border border-slate-300 rounded-lg px-3 py-2 w-full sm:w-auto"/>
                  <button
                    type="button"
                    disabled={uploading || selectedFiles.length === 0}
                    onClick={() => uploadSelected("edit")}
                    className="px-4 py-2 rounded-lg border bg-slate-100 hover:bg-slate-200 disabled:opacity-60"
                  >
                    {uploading ? "กำลังอัปโหลด..." : "อัปโหลด"}
                  </button>
                </div>

                {editForm.contractImages.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-3">
                    {editForm.contractImages.map((src, i) => (
                      <div key={i} className="relative w-28 h-28 rounded-lg overflow-hidden border">
                        <Image src={src} alt={`img-${i}`} fill className="object-cover" sizes="15vw" />
                        <button
                          type="button"
                          onClick={() => removeImageAt("edit", i)}
                          className="absolute top-1 right-1 bg-white/90 hover:bg-white text-rose-600 rounded-full h-6 w-6 flex items-center justify-center shadow"
                          title="ลบรูปนี้"
                        >
                          <i className="ri-close-line" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* All Contracts */}
        <section className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">สัญญาทั้งหมด</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto border border-gray-200">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left">ประเภท</th>
                  <th className="px-4 py-2 text-left">เริ่ม</th>
                  <th className="px-4 py-2 text-left">สิ้นสุด</th>
                  <th className="px-4 py-2 text-left">ค่าเช่า</th>
                  <th className="px-4 py-2 text-left">จำนวนรูป</th>
                </tr>
              </thead>
              <tbody>
                {sortedContracts.length ? (
                  sortedContracts.map((c, idx) => {
                    const isInitial = idx === 0;
                    const label = isInitial ? "สัญญาตั้งต้น" : `สัญญาเช่าต่อ ครั้งที่ ${idx}`;
                    return (
                      <tr key={c.id} className="border-t hover:bg-slate-50">
                        <td className="px-4 py-2">
                          <span className={`text-xs px-2 py-1 rounded-full border ${
                            isInitial
                              ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}>{label}</span>
                        </td>
                        <td className="px-4 py-2">{toThaiDate(c.startDate)}</td>
                        <td className="px-4 py-2">{toThaiDate(c.endDate)}</td>
                        <td className="px-4 py-2">{c.rentPerMonth.toLocaleString()} บาท</td>
                        <td className="px-4 py-2">{c.contractImages.length}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-3 text-center text-gray-500">ไม่มีข้อมูลสัญญา</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Lightbox */}
      {isViewerOpen && previewImages.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center"
          onClick={closeViewer}
          role="dialog"
          aria-modal="true"
        >
          <button
            onClick={closeViewer}
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white inline-flex items-center justify-center"
            title="ปิด (Esc)"
          >
            ✕
          </button>

          {previewImages.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prevImg(imagesRef.current); }}
                className="absolute left-3 sm:left-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white"
                title="ก่อนหน้า (←)"
              >
                ◀
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); nextImg(imagesRef.current); }}
                className="absolute right-3 sm:right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white"
                title="ถัดไป (→)"
              >
                ▶
              </button>
            </>
          )}

          <div className="relative w-[92vw] h-[78vh] sm:w-[86vw] sm:h-[82vh] max-w-6xl" onClick={(e) => e.stopPropagation()}>
            <Image
              src={previewImages[viewerIndex]}
              alt={`contract-large-${viewerIndex + 1}`}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>

          {previewImages.length > 1 && (
            <div className="absolute bottom-3 left-0 right-0 mx-auto flex gap-2 px-3 justify-center" onClick={(e) => e.stopPropagation()}>
              {previewImages.map((thumb, i) => (
                <button
                  key={i}
                  onClick={() => setViewerIndex(i)}
                  className={`relative w-16 h-12 sm:w-20 sm:h-14 rounded overflow-hidden border ${
                    viewerIndex === i ? "border-white" : "border-white/30 hover:border-white/60"
                  }`}
                  title={`รูปที่ ${i + 1}`}
                >
                  <Image src={thumb} alt={`thumb-${i + 1}`} fill className="object-cover" sizes="10vw" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal: Renew */}
      {showRenew && renewForm && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={cancelRenew} />
          <div className="relative flex min-h-full items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-800">เพิ่มสัญญาเช่าต่อ</h3>
                <button className="h-9 w-9 rounded-full hover:bg-slate-100 inline-flex items-center justify-center" onClick={cancelRenew}>
                  <i className="ri-close-line text-xl" />
                </button>
              </div>

              <div className="px-6 py-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">วันที่ทำสัญญา</label>
                    <input
                      type="date"
                      className="border border-slate-300 rounded-lg px-3 py-2 w-full"
                      value={renewForm.contractDate}
                      onChange={(e) => setRenewForm({ ...renewForm, contractDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">วันที่เริ่มสัญญา</label>
                    <input
                      type="date"
                      className="border border-slate-300 rounded-lg px-3 py-2 w-full"
                      value={renewForm.startDate}
                      onChange={(e) => setRenewForm({ ...renewForm, startDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">วันที่สิ้นสุดสัญญา</label>
                    <input
                      type="date"
                      className="border border-slate-300 rounded-lg px-3 py-2 w-full"
                      value={renewForm.endDate}
                      onChange={(e) => setRenewForm({ ...renewForm, endDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">ค่าเช่ารายเดือน (บาท)</label>
                    <input
                      type="number"
                      min={0}
                      className="border border-slate-300 rounded-lg px-3 py-2 w-full"
                      value={renewForm.rentPerMonth}
                      onChange={(e) => setRenewForm({ ...renewForm, rentPerMonth: e.target.value })}
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="text-sm font-medium text-slate-700 mb-1 block">ชื่อผู้ให้เช่า</label>
                    <input
                      className="border border-slate-300 rounded-lg px-3 py-2 w-full"
                      value={renewForm.dormOwnerName}
                      onChange={(e) => setRenewForm({ ...renewForm, dormOwnerName: e.target.value })}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-sm font-medium text-slate-700 mb-1 block">ที่อยู่หอพัก</label>
                    <input
                      className="border border-slate-300 rounded-lg px-3 py-2 w-full"
                      value={renewForm.dormAddress}
                      onChange={(e) => setRenewForm({ ...renewForm, dormAddress: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 block">แนบรูปสัญญาใหม่ (อัปโหลดได้สูงสุด 10 รูป)</label>
                  <div className="mt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <input type="file" accept="image/*" multiple onChange={onChooseFiles}
                      className="border border-slate-300 rounded-lg px-3 py-2 w-full sm:w-auto"/>
                    <button
                      type="button"
                      disabled={uploading || selectedFiles.length === 0}
                      onClick={() => uploadSelected("renew")}
                      className="px-4 py-2 rounded-lg border bg-slate-100 hover:bg-slate-200 disabled:opacity-60"
                    >
                      {uploading ? "กำลังอัปโหลด..." : "อัปโหลด"}
                    </button>
                  </div>

                  {renewForm.contractImages.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-3">
                      {renewForm.contractImages.map((src, i) => (
                        <div key={i} className="relative w-28 h-28 rounded-lg overflow-hidden border">
                          <Image src={src} alt={`img-${i}`} fill className="object-cover" sizes="15vw" />
                          <button
                            type="button"
                            onClick={() => removeImageAt("renew", i)}
                            className="absolute top-1 right-1 bg-white/90 hover:bg-white text-rose-600 rounded-full h-6 w-6 flex items-center justify-center shadow"
                            title="ลบรูปนี้"
                          >
                            <i className="ri-close-line" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="px-6 py-4 border-t flex justify-end gap-2">
                <button className="px-4 py-2 rounded-lg border bg-white hover:bg-slate-50" onClick={cancelRenew}>
                  ยกเลิก
                </button>
                <button className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700" onClick={saveRenew}>
                  บันทึกสัญญาเช่าต่อ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
