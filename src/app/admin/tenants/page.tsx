/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/sidebar";

// ---------- Types ----------
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
  status?: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE";
  roomStartDate?: string | null;
  assignedAt?: string | null;
  contractStartDate?: string | null;
  contractEndDate?: string | null;
}

type RoomStatus = "ALL" | "AVAILABLE" | "OCCUPIED" | "MAINTENANCE";

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
  startDate: string;
  dormOwnerName: string;
  dormAddress: string;
  tempPassword: string;
  // optional
  emailPrefix: string;
  emailDomain: string;
  contractImage1: string;
  contractImage2: string;
  contractImage3: string;
}

// ---------- Helpers ----------
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

const defaultForm: CreateTenantForm = {
  firstName: "",
  lastName: "",
  phone: "",
  birthday: "",
  address: "",
  nationalId: "",
  roomId: "",
  rentPerMonth: "",
  startDate: "",
  dormOwnerName: "",
  dormAddress: "",
  tempPassword: "",
  emailPrefix: "Dormmy",
  emailDomain: "@dorm.com",
  contractImage1: "",
  contractImage2: "",
  contractImage3: "",
};

export default function AdminTenantsPage() {
  // list states
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<RoomStatus>("ALL");

  // modal + form states
  const [showModal, setShowModal] = useState(false);
  const [availableRooms, setAvailableRooms] = useState<RoomOption[]>([]);
  const [form, setForm] = useState<CreateTenantForm>(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // upload states
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);

  // ---------- Effects ----------
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

  useEffect(() => {
    const urls = selectedFiles.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [selectedFiles]);

  // ---------- Derived ----------
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const fullText = `${user.firstName ?? ""} ${user.lastName ?? ""} ${user.email ?? ""}`.toLowerCase();
      const matchesSearch = fullText.includes(searchTerm.toLowerCase());
      const matchesStatus =
        filterStatus === "ALL" ||
        (filterStatus === "OCCUPIED" && user.status === "OCCUPIED") ||
        (filterStatus === "AVAILABLE" && user.status === "AVAILABLE") ||
        (filterStatus === "MAINTENANCE" && user.status === "MAINTENANCE");
      return matchesSearch && matchesStatus;
    });
  }, [users, searchTerm, filterStatus]);

  // ---------- Handlers ----------
  const handleOpenModal = () => {
    setForm(defaultForm);
    setSelectedFiles([]);
    setPreviews([]);
    setShowModal(true);
    // refresh ห้องว่างตอนกดเปิด เพื่อกันกรณีเพิ่งถูกจอง
    loadAvailableRooms();
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const onSelectFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setSelectedFiles(files.slice(0, 3)); // จำกัด 3 รูป
  };

  const uploadSelected = async () => {
    if (!selectedFiles.length) {
      setBanner({ type: "error", text: "กรุณาเลือกไฟล์ก่อน" });
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
      if (!res.ok) throw new Error(data?.error || "อัปโหลดล้มเหลว");

      setForm((s) => ({
        ...s,
        contractImage1: data.urls[0] ?? "",
        contractImage2: data.urls[1] ?? "",
        contractImage3: data.urls[2] ?? "",
      }));
      setSelectedFiles([]);
      setPreviews([]);
      setBanner({ type: "success", text: "อัปโหลดรูปสัญญาสำเร็จ" });
    } catch (e) {
      setBanner({ type: "error", text: (e as Error).message });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setBanner(null);

    const images = [form.contractImage1, form.contractImage2, form.contractImage3].filter(Boolean);

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
      dormOwnerName: form.dormOwnerName.trim(),
      dormAddress: form.dormAddress.trim(),
      tempPassword: form.tempPassword,
      contractImages: images,
      emailPrefix: form.emailPrefix.trim() || "Dormmy",
      emailDomain: form.emailDomain.trim() || "@dorm.com",
      // endDate / contractDate ไม่ส่ง ให้ backend คำนวณ (+1 ปี / now)
    };

    try {
      const res = await fetch("/api/admin/tenants/create-with-contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "ไม่สามารถสร้างผู้เช่าได้");
      }

      setBanner({ type: "success", text: "สร้างผู้เช่าพร้อมสัญญาสำเร็จ" });
      setShowModal(false);
      await loadTenants();
      await loadAvailableRooms();
    } catch (err) {
      setBanner({ type: "error", text: (err as Error).message });
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- UI ----------
  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-200 bg-white sticky top-0 h-screen">
        <Sidebar role="admin" />
      </aside>

      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto">
        {/* Header + Actions */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Tenant Management</h1>
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

            <select
              className="border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as RoomStatus)}
            >
              <option value="ALL">All</option>
              <option value="AVAILABLE">Available</option>
              <option value="OCCUPIED">Occupied</option>
            </select>

            <button
              onClick={handleOpenModal}
              className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 shadow-sm"
            >
              <i className="ri-user-add-line" />
              Add Tenant
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
                const initials =
                  `${(user.firstName ?? "").charAt(0)}${(user.lastName ?? "").charAt(0)}`.toUpperCase() || "?";

                const badgeClass =
                  user.status === "OCCUPIED"
                    ? "bg-green-100 text-green-700"
                    : user.status === "MAINTENANCE"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-slate-100 text-slate-600";

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
                        {user.status ?? "-"}
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
                    <div className="mt-4 flex justify-end">
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

        {/* ---------- Modal: Add Tenant ---------- */}
        {showModal && (
        <div className="fixed inset-0 z-50">
            {/* Overlay */}
            <div
            className="absolute inset-0 bg-black/40"
            onClick={() => !submitting && setShowModal(false)}
            />

            {/* Container (padding รอบ, responsive center) */}
            <div className="relative flex min-h-full items-center justify-center p-4 sm:p-6">
            {/* Panel (กำหนด max width + max height + sticky header/footer) */}
            <div className="w-full max-w-3xl lg:max-w-4xl bg-white rounded-2xl shadow-xl max-h-[85vh] overflow-hidden flex flex-col">
                {/* Header sticky */}
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

                {/* Body scrollable */}
                <div className="px-6 py-5 overflow-y-auto">
                {/* ให้ปุ่ม footer กด submit ฟอร์มนี้ด้วย id */}
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
                    <div className="flex flex-col">
                        <label className="text-sm font-medium text-slate-700 mb-1">รหัสผ่านเริ่มต้น</label>
                        <input
                        name="tempPassword"
                        className="border border-slate-300 rounded-lg px-3 py-2"
                        value={form.tempPassword}
                        onChange={handleChange}
                        placeholder="เช่น Temp12345"
                        required
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

                    {/* รูปสัญญา (อัปโหลดไฟล์ + URL Cloudinary) */}
                    <div>
                    <label className="text-sm font-medium text-slate-700">
                        รูปสัญญา (อัปโหลดได้สูงสุด 3 รูป) หรือวาง URL เอง
                    </label>

                    {/* เลือกไฟล์ + ปุ่มอัปโหลด */}
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
                        <span className="text-xs text-slate-500">เลือกได้สูงสุด 3 รูป (ไฟล์ภาพเท่านั้น)</span>
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

                    {/* ช่อง URL (แก้ไขได้) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                        <input
                        name="contractImage1"
                        placeholder="https://res.cloudinary.com/.../image1.jpg"
                        className="border border-slate-300 rounded-lg px-3 py-2"
                        value={form.contractImage1}
                        onChange={handleChange}
                        />
                        <input
                        name="contractImage2"
                        placeholder="https://res.cloudinary.com/.../image2.jpg"
                        className="border border-slate-300 rounded-lg px-3 py-2"
                        value={form.contractImage2}
                        onChange={handleChange}
                        />
                        <input
                        name="contractImage3"
                        placeholder="https://res.cloudinary.com/.../image3.jpg"
                        className="border border-slate-300 rounded-lg px-3 py-2"
                        value={form.contractImage3}
                        onChange={handleChange}
                        />
                    </div>
                    </div>

                    {/* Advanced: email prefix/domain */}
                    <details className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                    <summary className="cursor-pointer text-sm text-slate-700">
                        ตั้งค่าอีเมลอัตโนมัติจากเลขห้อง (ขั้นสูง)
                    </summary>
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
                    </details>
                </form>
                </div>

                {/* Footer sticky */}
                <div className="sticky bottom-0 z-10 flex justify-end gap-3 px-6 py-4 border-t bg-white">
                <button
                    type="button"
                    className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50"
                    onClick={() => !submitting && setShowModal(false)}
                >
                    ยกเลิก
                </button>
                {/* ปุ่มนี้ส่งฟอร์มด้านบนผ่าน id="createTenantForm" */}
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

    </div>
  );
}
