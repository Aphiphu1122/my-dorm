/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/sidebar";
import { Toaster, toast } from "react-hot-toast";

/* =================== Types =================== */
interface Profile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthday: string;
  address: string;
  nationalId: string;
  userId: string;
  roomNumber: string | null;
  status?: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE"; // backend อาจยังส่งมาได้ จึงคง type ไว้
  roomStartDate?: string | null;
  assignedAt?: string | null;
  contractStartDate?: string | null;
  contractEndDate?: string | null;
}

type RoomStatus = "ALL" | "AVAILABLE" | "OCCUPIED"; // ❌ เอา Maintenance ออกจากตัวกรอง

interface RoomOption {
  id: string;
  roomNumber: string;
}

interface CreateTenantForm {
  firstName: string;
  lastName: string;
  phone: string;
  birthday: string;
  address: string;
  nationalId: string;
  roomId: string;

  rentPerMonth: string;

  /** วันที่เริ่มสัญญา (ใช้คิดช่วงสัญญา) */
  startDate: string;

  /** วันที่ทำสัญญาจริง (ไม่บังคับ) */
  contractDate?: string;

  /** วันที่เข้าพักจริง (ไม่บังคับ, เว้นว่างได้ถ้ายังไม่เข้าพัก) */
  moveInDate?: string;

  dormOwnerName: string;
  dormAddress: string;

  // ขั้นสูง
  tempPassword: string;
  emailPrefix: string;
  emailDomain: string;

  // URLs (สูงสุด 10)
  contractImage1: string;
  contractImage2: string;
  contractImage3: string;
  contractImage4: string;
  contractImage5: string;
  contractImage6: string;
  contractImage7: string;
  contractImage8: string;
  contractImage9: string;
  contractImage10: string;
}

/* =================== Helpers (top-level, type-safe) =================== */
const imageKeys = [
  "contractImage1",
  "contractImage2",
  "contractImage3",
  "contractImage4",
  "contractImage5",
  "contractImage6",
  "contractImage7",
  "contractImage8",
  "contractImage9",
  "contractImage10",
] as const;
type ImageKey = (typeof imageKeys)[number];

interface UploadRes {
  urls: string[];
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function extractErrorMessage(v: unknown, fallback = "เกิดข้อผิดพลาด") {
  if (isRecord(v) && typeof v.error === "string") return v.error;
  if (isRecord(v) && isRecord(v.error) && typeof v.error.message === "string") {
    return v.error.message;
  }
  return fallback;
}

/* =================== Utils =================== */
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

/* ค่าเริ่มต้นของฟอร์ม */
const defaultForm: CreateTenantForm = {
  firstName: "",
  lastName: "",
  phone: "",
  birthday: "",
  address: "",
  nationalId: "",
  roomId: "",

  rentPerMonth: "3000",

  startDate: "",
  contractDate: "",
  moveInDate: "",

  dormOwnerName: "John Doe",
  dormAddress: "มหาวิทยาลัยพะเยา",

  // ขั้นสูง
  tempPassword: "dorm001",
  emailPrefix: "Dormmy",
  emailDomain: "@dorm.com",

  // รูป
  contractImage1: "",
  contractImage2: "",
  contractImage3: "",
  contractImage4: "",
  contractImage5: "",
  contractImage6: "",
  contractImage7: "",
  contractImage8: "",
  contractImage9: "",
  contractImage10: "",
};

export default function AdminTenantsPage() {
  /* ============== List states ============== */
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<RoomStatus>("ALL");

  /* ============== Modal + form states ============== */
  const [showModal, setShowModal] = useState(false);
  const [availableRooms, setAvailableRooms] = useState<RoomOption[]>([]);
  const [form, setForm] = useState<CreateTenantForm>(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState<{ type: "success" | "error"; text: string } | null>(null);

  /* ============== Upload states (เลือกไฟล์) ============== */
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);

  /* ============== Delete states ============== */
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* ============== Effects ============== */
  const loadTenants = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/tenants", { credentials: "include" });
      const data = await res.json();
      const list: Profile[] = res.ok && Array.isArray(data?.users) ? data.users : [];
      setUsers(list);
    } catch (e) {
      console.error("loadTenants error:", e);
      setUsers([]);
      setBanner({ type: "error", text: "โหลดรายชื่อผู้เช่าไม่สำเร็จ" });
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableRooms = async () => {
    try {
      const res = await fetch("/api/admin/rooms/available", { credentials: "include" });
    const data = await res.json();
      const rooms: RoomOption[] = res.ok && Array.isArray(data?.rooms) ? data.rooms : [];
      setAvailableRooms(rooms);
    } catch {
      setAvailableRooms([]);
    }
  };

  useEffect(() => {
    loadTenants();
    loadAvailableRooms();
  }, []);

  /* previews ของไฟล์ที่เลือก */
  useEffect(() => {
    const urls = selectedFiles.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [selectedFiles]);

  /* เลือกห้องแล้ว auto-gen รหัสผ่านจากเลขห้อง เป็น dorm### */
  useEffect(() => {
    if (!form.roomId) return;
    const selected = availableRooms.find((r) => r.id === form.roomId);
    if (!selected?.roomNumber) return;
    const digits = (selected.roomNumber.match(/\d+/g) || []).join("");
    const padded = digits.padStart(3, "0");
    setForm((s) => ({ ...s, tempPassword: `dorm${padded}` }));
  }, [form.roomId, availableRooms]);

  /* ============== Derived ============== */
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const fullText = `${user.firstName ?? ""} ${user.lastName ?? ""} ${user.email ?? ""}`.toLowerCase();
      const matchesSearch = fullText.includes(searchTerm.toLowerCase());
      const matchesStatus =
        filterStatus === "ALL" ||
        (filterStatus === "OCCUPIED" && user.status === "OCCUPIED") ||
        (filterStatus === "AVAILABLE" && user.status === "AVAILABLE");
      return matchesSearch && matchesStatus;
    });
  }, [users, searchTerm, filterStatus]);

  /* ============== Handlers ============== */
  const handleOpenModal = () => {
    setForm(defaultForm);
    setSelectedFiles([]);
    setPreviews([]);
    setShowModal(true);
    loadAvailableRooms(); // refresh ห้องว่างตอนเปิด
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const onSelectFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setSelectedFiles(files.slice(0, 10)); // สูงสุด 10 รูป
  };

  /** อัปโหลดรูปแบบไม่ใช้ any + ป้อนลง contractImage1..10 */
  const uploadSelected = async () => {
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

      const json: unknown = await res.json();
      if (!res.ok) {
        throw new Error(extractErrorMessage(json, "อัปโหลดล้มเหลว"));
      }
      const data = json as UploadRes;

      // ใส่ URL ลงในช่อง contractImage1..10
      setForm((prev) => {
        const patch: Partial<CreateTenantForm> = {};
        imageKeys.forEach((key, i) => {
          const url = Array.isArray(data.urls) ? data.urls[i] : undefined;
          if (typeof url === "string" && url) patch[key] = url;
        });
        return { ...prev, ...patch };
      });

      setSelectedFiles([]);
      setPreviews([]);
      toast.success("อัปโหลดรูปสัญญาสำเร็จ");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const removeUploadedAt = (idx: number) => {
    setForm((prev) => {
      const key = imageKeys[idx] as ImageKey | undefined;
      if (!key) return prev;
      return { ...prev, [key]: "" };
    });
  };

  const validateForm = (): boolean => {
    const isEmpty = (v: string | undefined) => !v || !v.trim();
    const requiredEmpty =
      isEmpty(form.firstName) ||
      isEmpty(form.lastName) ||
      isEmpty(form.phone) ||
      isEmpty(form.birthday) ||
      isEmpty(form.address) ||
      isEmpty(form.nationalId) ||
      isEmpty(form.roomId) ||
      isEmpty(form.rentPerMonth) ||
      isEmpty(form.startDate) ||
      isEmpty(form.tempPassword) ||
      isEmpty(form.dormOwnerName) ||
      isEmpty(form.dormAddress);

    if (requiredEmpty) {
      toast.error("กรุณากรอกให้ครบทุกช่องที่จำเป็น");
      return false;
    }
    if (!/^\d{13}$/.test((form.nationalId || "").trim())) {
      toast.error("เลขบัตรประชาชนต้องมี 13 หลัก");
      return false;
    }
    if ((form.phone || "").replace(/\D/g, "").length < 9) {
      toast.error("กรุณากรอกเบอร์โทรให้ถูกต้อง (อย่างน้อย 9 หลัก)");
      return false;
    }
    const rent = Number(form.rentPerMonth);
    if (!Number.isFinite(rent) || rent <= 0) {
      toast.error("ค่าเช่าต้องมากกว่า 0");
      return false;
    }
    if (isNaN(Date.parse(form.birthday))) {
      toast.error("วันเกิดไม่ถูกต้อง");
      return false;
    }
    if (isNaN(Date.parse(form.startDate))) {
      toast.error("วันที่เริ่มสัญญาไม่ถูกต้อง");
      return false;
    }
    if (form.contractDate && isNaN(Date.parse(form.contractDate))) {
      toast.error("วันที่ทำสัญญาจริงไม่ถูกต้อง");
      return false;
    }
    if (form.moveInDate && isNaN(Date.parse(form.moveInDate))) {
      toast.error("วันที่เข้าพักไม่ถูกต้อง");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    setBanner(null);

    const images = imageKeys.map((k) => form[k]).filter(Boolean);

    const payload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      phone: form.phone.trim(),
      birthday: form.birthday,
      address: form.address.trim(),
      nationalId: form.nationalId.trim(),
      roomId: form.roomId,
      rentPerMonth: Number(form.rentPerMonth),

      startDate: form.startDate,
      contractDate: form.contractDate || undefined,
      moveInDate: form.moveInDate || undefined,

      dormOwnerName: form.dormOwnerName.trim(),
      dormAddress: form.dormAddress.trim(),

      tempPassword: form.tempPassword,

      contractImages: images,
      emailPrefix: form.emailPrefix.trim() || "Dormmy",
      emailDomain: form.emailDomain.trim() || "@dorm.com",
    };

    try {
      const res = await fetch("/api/admin/tenants/create-with-contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(extractErrorMessage(data, "ไม่สามารถสร้างผู้เช่าได้"));

      toast.success("สร้างผู้เช่าพร้อมสัญญาสำเร็จ");
      setBanner({ type: "success", text: "สร้างผู้เช่าพร้อมสัญญาสำเร็จ" });
      setShowModal(false);
      await loadTenants();
      await loadAvailableRooms();
    } catch (err) {
      toast.error((err as Error).message);
      setBanner({ type: "error", text: (err as Error).message });
    } finally {
      setSubmitting(false);
    }
  };

  /* ลบผู้ใช้ (ห้ามลบถ้า OCCUPIED) */
  const requestDelete = (u: Profile) => {
    if (u.status === "OCCUPIED") {
      toast.error("ไม่สามารถลบผู้ใช้ที่กำลังเช่าอยู่ได้");
      return;
    }
    setDeleteTarget({ id: u.id, name: `${u.firstName} ${u.lastName}`.trim() });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/tenants/${deleteTarget.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(extractErrorMessage(data, "ลบผู้ใช้ไม่สำเร็จ"));

      toast.success("ลบผู้ใช้เรียบร้อย");
      setDeleteTarget(null);
      await loadTenants();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  /* ============== UI ============== */
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Toaster position="top-right" />

      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-200 bg-white sticky top-0 h-screen">
        <Sidebar role="admin" />
      </aside>

      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto">
        {/* Header + Actions */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">จัดการผู้เช่า</h1>
            <p className="text-slate-500">จัดการผู้เช่า ห้องพัก และสัญญา</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white">
              <span className="px-2 text-slate-500">
                <i className="ri-search-line text-lg" />
              </span>
              <input
                type="text"
                placeholder="ค้นหาชื่อหรืออีเมล"
                className="px-3 py-2 outline-none min-w-[230px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* ❌ ไม่มีตัวเลือก Maintenance แล้ว */}
            <select
              className="border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as RoomStatus)}
            >
              <option value="ALL">ทั้งหมด</option>
              <option value="AVAILABLE">ว่าง</option>
              <option value="OCCUPIED">ใช้งาน</option>
            </select>

            <button
              onClick={handleOpenModal}
              className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 shadow-sm"
            >
              <i className="ri-user-add-line" />
              เพิ่มบัญชีผู้ใช้
            </button>
          </div>
        </div>

        {/* Banner */}
        {banner && (
          <div
            className={`mb-4 rounded-lg px-4 py-3 border ${
              banner.type === "success"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-rose-50 text-rose-700 border-rose-200"
            }`}
          >
            {banner.text}
          </div>
        )}

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading
            ? Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl shadow p-4 h-44 animate-pulse" />
              ))
            : filteredUsers.map((user) => {
                // ถ้าไม่มีห้อง -> แสดงเป็น MOVEOUT
                const derivedStatus = user.roomNumber ? (user.status ?? "-") : ("MOVEOUT" as const);
                const badgeClass =
                  derivedStatus === "OCCUPIED"
                    ? "bg-green-100 text-green-700"
                    : derivedStatus === "MOVEOUT"
                    ? "bg-fuchsia-100 text-fuchsia-700"
                    : "bg-slate-100 text-slate-600";

                const initials =
                  `${(user.firstName ?? "").charAt(0)}${(user.lastName ?? "").charAt(0)}`.toUpperCase() || "?";

                return (
                  <div
                    key={user.id}
                    className="bg-white rounded-2xl shadow-sm hover:shadow-md transition p-5 flex flex-col justify-between"
                  >
                    {/* header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
                          {initials}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-slate-500">{user.email}</div>
                        </div>
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badgeClass}`}>
                        {derivedStatus}
                      </span>
                    </div>

                    {/* body */}
                    <div className="grid grid-cols-2 gap-2 text-sm text-slate-700">
                      <div className="flex items-center gap-2">
                        <i className="ri-phone-fill text-slate-400" />
                        <span>{user.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <i className="ri-home-4-fill text-slate-400" />
                        <span>{user.roomNumber ?? "-"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <i className="ri-calendar-fill text-slate-400" />
                        <span>
                          {toThaiDate(user.contractStartDate ?? user.roomStartDate) !== "-"
                            ? toThaiDate(user.contractStartDate ?? user.roomStartDate)
                            : toThaiDate(user.assignedAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <i className="ri-calendar-event-fill text-slate-400" />
                        <span>สิ้นสุด: {toThaiDate(user.contractEndDate)}</span>
                      </div>
                    </div>

                    {/* footer actions */}
                    <div className="mt-4 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => requestDelete(user)}
                        disabled={user.status === "OCCUPIED"}
                        title={user.status === "OCCUPIED" ? "ผู้ใช้นี้กำลังเช่าอยู่ ไม่สามารถลบได้" : "ลบผู้ใช้"}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-rose-700 border-rose-200 hover:bg-rose-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <i className="ri-delete-bin-line" />
                        ลบ
                      </button>

                      <Link
                        href={`/admin/tenants/${user.id}`}
                        className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                      >
                        ดูรายละเอียด <i className="ri-arrow-right-line" />
                      </Link>
                    </div>
                  </div>
                );
              })}
        </div>
      </main>

      {/* ========== Modal: Add Tenant ========== */}
      {showModal && (
        <div className="fixed inset-0 z-50">
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/40" onClick={() => !submitting && setShowModal(false)} />

          {/* Container */}
          <div className="relative flex min-h-full items-center justify-center p-4 sm:p-6">
            {/* Panel */}
            <div className="w-full max-w-3xl lg:max-w-4xl bg-white rounded-2xl shadow-xl max-h-[85vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b bg-white">
                <h3 className="text-lg font-semibold text-slate-800">เพิ่มผู้ใช้รายใหม่</h3>
                <button
                  className="h-9 w-9 inline-flex items-center justify-center rounded-full hover:bg-slate-100"
                  onClick={() => !submitting && setShowModal(false)}
                  title="Close"
                >
                  <i className="ri-close-line text-xl" />
                </button>
              </div>

              {/* Body */}
              <div className="px-6 py-5 overflow-y-auto">
                <form id="createTenantForm" onSubmit={handleSubmit} className="space-y-5">
                  {/* ผู้เช่า */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-slate-700 mb-1">ชื่อ</label>
                      <input
                        name="firstName"
                        className="border border-slate-300 rounded-lg px-3 py-2"
                        value={form.firstName}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-slate-700 mb-1">นามสกุล</label>
                      <input
                        name="lastName"
                        className="border border-slate-300 rounded-lg px-3 py-2"
                        value={form.lastName}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-slate-700 mb-1">เบอร์โทร</label>
                      <input
                        name="phone"
                        className="border border-slate-300 rounded-lg px-3 py-2"
                        value={form.phone}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-slate-700 mb-1">วันเกิด</label>
                      <input
                        type="date"
                        name="birthday"
                        className="border border-slate-300 rounded-lg px-3 py-2"
                        value={form.birthday}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="flex flex-col md:col-span-2">
                      <label className="text-sm font-medium text-slate-700 mb-1">ที่อยู่</label>
                      <textarea
                        name="address"
                        className="border border-slate-300 rounded-lg px-3 py-2"
                        rows={2}
                        value={form.address}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="flex flex-col md:col-span-2">
                      <label className="text-sm font-medium text-slate-700 mb-1">เลขบัตรประชาชน</label>
                      <input
                        name="nationalId"
                        className="border border-slate-300 rounded-lg px-3 py-2"
                        value={form.nationalId}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  {/* ห้อง & สัญญา */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-slate-700 mb-1">เลือกห้องว่าง</label>
                      <select
                        name="roomId"
                        className="border border-slate-300 rounded-lg px-3 py-2 bg-white"
                        value={form.roomId}
                        onChange={handleChange}
                        required
                      >
                        <option value="">-- เลือกห้อง --</option>
                        {availableRooms.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.roomNumber}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-slate-700 mb-1">ค่าเช่า / เดือน (บาท)</label>
                      <input
                        type="number"
                        min="0"
                        inputMode="numeric"
                        name="rentPerMonth"
                        className="border border-slate-300 rounded-lg px-3 py-2"
                        value={form.rentPerMonth}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-slate-700 mb-1">วันที่เริ่มสัญญา</label>
                      <input
                        type="date"
                        name="startDate"
                        className="border border-slate-300 rounded-lg px-3 py-2"
                        value={form.startDate}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    {/* ✅ ช่องใหม่: วันที่ทำสัญญาจริง */}
                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-slate-700 mb-1">วันที่ทำสัญญาฉบับจริง (ถ้ามี)</label>
                      <input
                        type="date"
                        name="contractDate"
                        className="border border-slate-300 rounded-lg px-3 py-2"
                        value={form.contractDate}
                        onChange={handleChange}
                        placeholder="ถ้ายังไม่มีให้เว้นว่าง"
                      />
                    </div>

                    {/* ✅ ช่องใหม่: วันที่เข้าพักจริง (เว้นว่างได้ถ้ายังไม่เข้าพัก) */}
                    <div className="flex flex-col md:col-span-2">
                      <label className="text-sm font-medium text-slate-700 mb-1">
                        วันที่เข้าพักจริง
                      </label>
                      <input
                        type="date"
                        name="moveInDate"
                        className="border border-slate-300 rounded-lg px-3 py-2"
                        value={form.moveInDate}
                        onChange={handleChange}
                        placeholder="ถ้ายังไม่เข้าพักให้เว้นว่าง"
                      />
                    </div>
                  </div>

                  {/* ข้อมูลหอ */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-slate-700 mb-1">ชื่อผู้ให้เช่า (เจ้าของหอ)</label>
                      <input
                        name="dormOwnerName"
                        className="border border-slate-300 rounded-lg px-3 py-2"
                        value={form.dormOwnerName}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="flex flex-col md:col-span-2">
                      <label className="text-sm font-medium text-slate-700 mb-1">ที่อยู่หอพัก</label>
                      <input
                        name="dormAddress"
                        className="border border-slate-300 rounded-lg px-3 py-2"
                        value={form.dormAddress}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  {/* รูปสัญญา: เลือกไฟล์ + อัปโหลด */}
                  <div>
                    <label className="text-sm font-medium text-slate-700">
                      รูปสัญญาที่เกี่ยวข้อง (อัปโหลดได้สูงสุด 10 รูป)
                    </label>

                    <div className="mt-2 flex flex-col md:flex-row items-stretch md:items-center gap-3">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={onSelectFiles}
                        className="border border-slate-300 rounded-lg px-3 py-2 w-full md:w-auto"
                      />
                      <button
                        type="button"
                        onClick={uploadSelected}
                        disabled={uploading || selectedFiles.length === 0}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border bg-slate-100 hover:bg-slate-200 disabled:opacity-60"
                      >
                        {uploading ? "กำลังอัปโหลด..." : "อัปโหลดไฟล์ไป Cloudinary"}
                      </button>
                      <span className="text-xs text-slate-500">เลือกได้สูงสุด 10 รูป (ไฟล์ภาพเท่านั้น)</span>
                    </div>

                    {/* พรีวิวไฟล์ที่จะอัปโหลด */}
                    {previews.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-3">
                        {previews.map((src, idx) => (
                          <div key={idx} className="w-28 h-28 rounded-lg overflow-hidden border">
                            <img src={src} alt={`preview-${idx}`} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* แสดงรูปที่อัปโหลดแล้ว */}
                    {imageKeys.map((k) => form[k]).some(Boolean) && (
                      <div className="mt-4">
                        <div className="text-xs text-slate-600 mb-2">อัปโหลดแล้ว</div>
                        <div className="flex flex-wrap gap-3">
                          {imageKeys.map((k, i) =>
                            form[k] ? (
                              <div key={k} className="relative w-28 h-28 rounded-lg overflow-hidden border">
                                <img src={form[k]} alt={`uploaded-${i}`} className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => removeUploadedAt(i)}
                                  className="absolute top-1 right-1 bg-white/90 hover:bg-white text-rose-600 rounded-full h-6 w-6 flex items-center justify-center shadow"
                                  title="ลบรูปนี้"
                                >
                                  <i className="ri-close-line" />
                                </button>
                              </div>
                            ) : null
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ขั้นสูง: อีเมล & รหัสผ่านเริ่มต้น */}
                  <details className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                    <summary className="cursor-pointer text-sm text-slate-700">
                      ขั้นสูง: ชื่อผู้ใช้ & รหัสผ่านเริ่มต้น
                    </summary>

                    {/* Email */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                      <div className="flex flex-col">
                        <label className="text-xs font-medium text-slate-600 mb-1">Prefix</label>
                        <input
                          name="emailPrefix"
                          className="border border-slate-300 rounded-lg px-3 py-2"
                          value={form.emailPrefix}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-xs font-medium text-slate-600 mb-1">Domain</label>
                        <input
                          name="emailDomain"
                          className="border border-slate-300 rounded-lg px-3 py-2"
                          value={form.emailDomain}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
                      <div className="flex flex-col">
                        <label className="text-xs font-medium text-slate-600 mb-1">รหัสผ่านเริ่มต้น</label>
                        <input
                          name="tempPassword"
                          className="border border-slate-300 rounded-lg px-3 py-2"
                          value={form.tempPassword}
                          onChange={handleChange}
                          placeholder="เช่น dorm001"
                          required
                        />
                        <p className="text-xs text-slate-500 mt-1">
                          ระบบจะสร้างให้อัตโนมัติจากเลขห้องในรูปแบบ <code>dorm###</code> (เช่น 001 ⇒ dorm001)
                        </p>
                      </div>
                      <div className="flex items-end">
                        <button
                          type="button"
                          className="px-3 py-2 rounded-lg border bg-white hover:bg-slate-50"
                          onClick={() => {
                            const sel = availableRooms.find((r) => r.id === form.roomId);
                            if (!sel?.roomNumber) {
                              toast.error("กรุณาเลือกห้องก่อน");
                              return;
                            }
                            const digits = (sel.roomNumber.match(/\d+/g) || []).join("");
                            const padded = digits.padStart(3, "0");
                            setForm((s) => ({ ...s, tempPassword: `dorm${padded}` }));
                            toast.success("สร้างรหัสผ่านจากเลขห้องแล้ว");
                          }}
                        >
                          สร้างจากเลขห้อง
                        </button>
                      </div>
                    </div>
                  </details>
                </form>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 z-10 flex justify-end gap-3 px-6 py-4 border-t bg-white">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50"
                  onClick={() => !submitting && setShowModal(false)}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  form="createTenantForm"
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  {submitting ? "กำลังบันทึก..." : "บันทึก"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== Modal: Confirm Delete ========== */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => !deleting && setDeleteTarget(null)} />
          <div className="relative flex min-h-full items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="px-5 py-4 border-b">
                <h3 className="text-lg font-semibold text-slate-800">ยืนยันการลบผู้ใช้</h3>
              </div>
              <div className="px-5 py-4">
                <p className="text-slate-700">
                  ต้องการลบผู้ใช้ <span className="font-semibold">{deleteTarget.name}</span> ใช่หรือไม่?
                </p>
                <p className="text-sm text-slate-500 mt-2">
                  การลบนี้ไม่สามารถกู้คืนได้ โปรดตรวจสอบให้แน่ใจว่าผู้ใช้ไม่ได้เช่าอยู่
                </p>
              </div>
              <div className="px-5 py-4 border-t flex justify-end gap-2">
                <button
                  className="px-4 py-2 rounded-lg border bg-white hover:bg-slate-50"
                  onClick={() => !deleting && setDeleteTarget(null)}
                >
                  ยกเลิก
                </button>
                <button
                  className="px-4 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60"
                  onClick={confirmDelete}
                  disabled={deleting}
                >
                  {deleting ? "กำลังลบ..." : "ลบผู้ใช้"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
