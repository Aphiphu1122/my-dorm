"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/sidebar";
import Image from "next/image";

/** ===== Types ===== */
type Contract = {
  id: string;
  startDate: string;
  endDate: string;
  rentPerMonth: number;
  contractImages: string[];
  dormOwnerName: string;
  dormAddress: string;
  contractDate: string;
};

type UserProfile = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthday: string; // ISO
  address: string;
  nationalId: string;
  room?: { roomNumber: string | null } | null;

  // มาจาก table contract
  contracts?: Contract[];
};

type FieldErrors = Record<string, string[] | undefined>;
type ApiErrorObject = { fieldErrors?: FieldErrors; formErrors?: string[] };
type ApiErrorResponse = { error: string } | { error: ApiErrorObject };
type ApiSuccessResponse = { message?: string };

/** ===== Type Guards ===== */
function isRecord(val: unknown): val is Record<string, unknown> {
  return !!val && typeof val === "object";
}
function isApiErrorObject(val: unknown): val is ApiErrorObject {
  return isRecord(val) && ("fieldErrors" in val || "formErrors" in val);
}
function isApiErrorResponse(data: unknown): data is ApiErrorResponse {
  return isRecord(data) && "error" in data;
}

/** ===== Component ===== */
export default function ProfilePage() {
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [error, setError] = useState("");

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const [activeTab, setActiveTab] = useState<"personal" | "password">("personal");

  // ---- Lightbox (ดูรูปสัญญา) ----
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/profile/me", { credentials: "include" });
        const data = await res.json();
        if (!res.ok) {
          toast.error((data as ApiErrorResponse)?.error as string || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
          return;
        }
        setProfile(data as UserProfile);
        setFormData(data as UserProfile);
      } catch (err) {
        console.error(err);
        toast.error("ไม่สามารถโหลดข้อมูลได้");
      }
    };
    fetchProfile();
  }, []);

  // เลือก “สัญญาล่าสุด”
  const latestContract: Contract | null = useMemo(() => {
    const cs = profile?.contracts ?? [];
    if (!cs.length) return null;
    return cs.reduce<Contract | null>((acc, c) => {
      if (!acc) return c;
      return new Date(c.startDate) > new Date(acc.startDate) ? c : acc;
    }, null);
  }, [profile?.contracts]);

  // รูปจากสัญญาล่าสุด
  const contractImages: string[] = latestContract?.contractImages ?? [];

  const formattedBirthday =
    profile?.birthday
      ? new Date(profile.birthday).toLocaleDateString("th-TH", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      : "-";

  const toThaiDate = (iso?: string | null) => {
    if (!iso) return "-";
    const t = new Date(iso);
    return isNaN(t.getTime())
      ? "-"
      : t.toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });
  };

  const validate = () => {
    if (!formData.firstName?.trim() || !formData.lastName?.trim()) {
      toast.error("กรุณากรอกชื่อและนามสกุล");
      return false;
    }
    if (!formData.phone?.match(/^\d{9,10}$/)) {
      toast.error("กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง");
      return false;
    }
    if (!formData.birthday || isNaN(new Date(formData.birthday).getTime())) {
      toast.error("กรุณาระบุวันเกิดให้ถูกต้อง");
      return false;
    }
    if (!formData.address?.trim()) {
      toast.error("กรุณากรอกที่อยู่");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    setError("");
    if (!validate()) return;

    try {
      const res = await fetch("/api/profile/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          firstName: formData.firstName?.trim(),
          lastName: formData.lastName?.trim(),
          phone: formData.phone,
          birthday: formData.birthday,
          address: formData.address?.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg =
          (data as ApiErrorResponse)?.error as string ||
          "เกิดข้อผิดพลาดในการอัปเดตข้อมูล";
        toast.error(msg);
        return;
      }
      setProfile((data as { user: UserProfile }).user);
      setEditing(false);
      toast.success("อัปเดตข้อมูลสำเร็จแล้ว");
      router.push("/home");
    } catch (err) {
      console.error(err);
      toast.error("เกิดข้อผิดพลาดในการบันทึก");
    }
  };

  /** ===== ดึงข้อความ error จาก JSON ของ API ===== */
  const getApiErrorMessage = (data: unknown): string => {
    if (!isApiErrorResponse(data)) return "เกิดข้อผิดพลาด";
    if (typeof data.error === "string") return data.error;

    if (isApiErrorObject(data.error)) {
      const fe = data.error.fieldErrors ?? {};
      const form = data.error.formErrors ?? [];

      const candidates: (string | undefined)[] = [
        fe["oldPassword"]?.[0],
        fe["newPassword"]?.[0],
        fe["confirmPassword"]?.[0],
      ];

      if (!candidates.some(Boolean)) {
        for (const key of Object.keys(fe)) {
          const arr = fe[key];
          if (arr && arr[0]) {
            candidates.push(arr[0]);
            break;
          }
        }
      }

      const firstFieldError = candidates.find(Boolean);
      if (firstFieldError) return firstFieldError;
      if (form.length > 0) return form[0];
    }
    return "เกิดข้อผิดพลาด";
  };

  const handleChangePassword = async () => {
    if (changingPassword) return;

    const oldP = oldPassword.trim();
    const newP = newPassword.trim();
    const confirmP = confirmPassword.trim();

    if (!oldP || !newP || !confirmP) {
      toast.error("กรุณากรอกข้อมูลให้ครบทุกช่อง");
      return;
    }
    if (newP.length < 6) {
      toast.error("รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }
    if (newP !== confirmP) {
      toast.error("รหัสผ่านใหม่ไม่ตรงกัน");
      return;
    }
    if (oldP === newP) {
      toast.error("รหัสผ่านใหม่ต้องแตกต่างจากรหัสผ่านเดิม");
      return;
    }

    setChangingPassword(true);
    try {
      const res = await fetch("/api/profile/change-password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ oldPassword: oldP, newPassword: newP, confirmPassword: confirmP }),
      });

      const data: unknown = await res.json();

      if (!res.ok) {
        toast.error(getApiErrorMessage(data));
        return;
      }

      toast.success((data as ApiSuccessResponse).message || "เปลี่ยนรหัสผ่านสำเร็จ");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error(err);
      toast.error("เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Lightbox helpers (เหมือนฝั่ง admin: คลิกที่รูปย่อเพื่อเปิด ไม่ต้องมีปุ่ม)
  const openLightbox = (idx: number) => {
    if (!contractImages.length) return;
    setCurrentIndex(idx);
    setLightboxOpen(true);
  };
  const closeLightbox = () => setLightboxOpen(false);
  const showPrev = useCallback(() => {
    if (!contractImages.length) return;
    setCurrentIndex((i) => (i - 1 + contractImages.length) % contractImages.length);
  }, [contractImages.length]);
  const showNext = useCallback(() => {
    if (!contractImages.length) return;
    setCurrentIndex((i) => (i + 1) % contractImages.length);
  }, [contractImages.length]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") showPrev();
      if (e.key === "ArrowRight") showNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxOpen, showPrev, showNext]);

  if (error) {
    return <p className="text-red-600 text-center mt-4 font-medium">{error}</p>;
  }
  if (!profile) {
    return (
      <div className="flex min-h-screen bg-white">
        <aside className="w-64 border-r border-gray-200 sticky top-0 h-screen">
          <Sidebar role="user" />
        </aside>
        <main className="flex-1 p-8">
          <div className="bg-white rounded-2xl shadow p-6 animate-pulse">กำลังโหลดข้อมูล...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white">
      <aside className="w-64 border-r border-gray-200 sticky top-0 h-screen">
        <Sidebar role="user" />
      </aside>

      <main className="flex-1 p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div>
          <h3 className="text-3xl font-bold mb-1 text-[#0F3659]">แก้ไขโปรไฟล์</h3>
          <p className="text-gray-500 mb-8">คุณสามารถจัดการข้อมูลส่วนตัวและรหัสผ่านได้ที่นี่</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab("personal")}
            className={`px-6 py-2 font-semibold ${
              activeTab === "personal"
                ? "border-b-4 border-[#0F3659] text-[#0F3659]"
                : "text-gray-500 hover:text-gray-600"
            } transition`}
          >
            ข้อมูลส่วนตัว
          </button>
          <button
            onClick={() => setActiveTab("password")}
            className={`px-6 py-2 font-semibold ${
              activeTab === "password"
                ? "border-b-4 border-[#0F3659] text-[#0F3659]"
                : "text-gray-500 hover:text-gray-600"
            } transition`}
          >
            เปลี่ยนรหัสผ่าน
          </button>
        </div>

        {/* Personal Info Tab */}
        {activeTab === "personal" && (
          <>
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 flex flex-col lg:flex-row gap-6">
              {/* Left avatar */}
              <div className="flex flex-col items-center w-full lg:w-1/3 pb-6 lg:pb-0">
                <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-gray-400 mb-4 flex items-center justify-center bg-gray-400 text-white text-5xl font-bold">
                  {profile ? `${profile.firstName?.[0] || ""}${profile.lastName?.[0] || ""}` : ""}
                </div>
                <h2 className="text-xl font-semibold text-gray-800">
                  {profile?.firstName} {profile?.lastName}
                </h2>
                <p className="text-gray-500">{profile?.email}</p>
              </div>

              {/* Right Form */}
              <div className="flex-1 space-y-4 lg:ml-8">
                <h2 className="text-2xl font-semibold text-[#0F3659] mb-4">ข้อมูลส่วนตัว</h2>

                {/* First Name */}
                <div className="flex flex-col md:flex-row md:items-center gap-2">
                  <label className="w-40 text-gray-600 font-medium">ชื่อ</label>
                  {editing ? (
                    <input
                      name="firstName"
                      value={formData.firstName || ""}
                      onChange={handleChange}
                      className="flex-1 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                    />
                  ) : (
                    <span className="flex-1 text-gray-800">{profile.firstName}</span>
                  )}
                </div>

                {/* Last Name */}
                <div className="flex flex-col md:flex-row md:items-center gap-2">
                  <label className="w-40 text-gray-600 font-medium">นามสกุล</label>
                  {editing ? (
                    <input
                      name="lastName"
                      value={formData.lastName || ""}
                      onChange={handleChange}
                      className="flex-1 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                    />
                  ) : (
                    <span className="flex-1 text-gray-800">{profile.lastName}</span>
                  )}
                </div>

                {/* Email */}
                <div className="flex flex-col md:flex-row md:items-center gap-2">
                  <label className="w-40 text-gray-600 font-medium">อีเมล</label>
                  <span className="flex-1 text-gray-800">{profile.email}</span>
                </div>

                {/* Phone */}
                <div className="flex flex-col md:flex-row md:items-center gap-2">
                  <label className="w-40 text-gray-600 font-medium">เบอร์โทรศัพท์</label>
                  {editing ? (
                    <input
                      name="phone"
                      value={formData.phone || ""}
                      onChange={handleChange}
                      className="flex-1 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                    />
                  ) : (
                    <span className="flex-1 text-gray-800">{profile.phone}</span>
                  )}
                </div>

                {/* Birthday */}
                <div className="flex flex-col md:flex-row md:items-center gap-2">
                  <label className="w-40 text-gray-600 font-medium">วันเกิด</label>
                  {editing ? (
                    <input
                      name="birthday"
                      type="date"
                      value={formData.birthday?.substring(0, 10) || ""}
                      onChange={handleChange}
                      className="flex-1 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                    />
                  ) : (
                    <span className="flex-1 text-gray-800">{formattedBirthday}</span>
                  )}
                </div>

                {/* Address */}
                <div className="flex flex-col md:flex-row md:items-start gap-2">
                  <label className="w-40 text-gray-600 font-medium">ที่อยู่</label>
                  {editing ? (
                    <textarea
                      name="address"
                      value={formData.address || ""}
                      onChange={handleChange}
                      className="flex-1 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition resize-none"
                    />
                  ) : (
                    <span className="flex-1 text-gray-800">{profile.address}</span>
                  )}
                </div>

                {/* National ID */}
                <div className="flex flex-col md:flex-row md:items-center gap-2">
                  <label className="w-40 text-gray-600 font-medium">เลขบัตรประชาชน</label>
                  <span className="flex-1 text-gray-800">{profile.nationalId}</span>
                </div>

                {/* Room */}
                <div className="flex flex-col md:flex-row md:items-center gap-2">
                  <label className="w-40 text-gray-600 font-medium">ห้องพัก</label>
                  <span className="flex-1 text-gray-800">{profile.room?.roomNumber ?? "-"}</span>
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-3 mt-4">
                  {editing ? (
                    <>
                      <button
                        onClick={handleSave}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md transition"
                      >
                        บันทึก
                      </button>
                      <button
                        onClick={() => setEditing(false)}
                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-md transition"
                      >
                        ยกเลิก
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setEditing(true)}
                      className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold px-8 py-2 rounded-md transition"
                    >
                      แก้ไข
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* ===== สัญญาเช่า ===== */}
            <section className="mt-6 bg-white border border-gray-200 rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-[#0F3659]">สัญญาเช่า</h3>
                <div className="text-sm text-gray-500">
                  ทั้งหมด: {profile.contracts?.length ?? 0} ฉบับ
                </div>
              </div>

              {/* สรุปสัญญาล่าสุด */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
                <div><span className="font-semibold">วันที่ทำสัญญา:</span> {toThaiDate(latestContract?.contractDate)}</div>
                <div><span className="font-semibold">ค่าเช่ารายเดือน:</span> {latestContract?.rentPerMonth?.toLocaleString() ?? "-"}</div>
                <div><span className="font-semibold">วันที่เริ่มสัญญา:</span> {toThaiDate(latestContract?.startDate)}</div>
                <div><span className="font-semibold">วันที่สิ้นสุดสัญญา:</span> {toThaiDate(latestContract?.endDate)}</div>
                <div><span className="font-semibold">ผู้ให้เช่า:</span> {latestContract?.dormOwnerName ?? "-"}</div>
                <div><span className="font-semibold">ที่อยู่หอพัก:</span> {latestContract?.dormAddress ?? "-"}</div>
              </div>

              {/* รูปสัญญา — คลิกที่รูปย่อเพื่อดูเต็มจอ (เหมือนฝั่ง admin) */}
              <div className="mt-4">
                {contractImages.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {contractImages.map((src, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => openLightbox(i)}
                        className="group relative w-full aspect-[4/3] overflow-hidden rounded border focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        title="คลิกเพื่อขยาย"
                      >
                        <Image
                          src={src}
                          alt={`contract-${i + 1}`}
                          fill
                          className="object-cover transition-transform group-hover:scale-[1.03]"
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                          priority={i === 0}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">ไม่มีรูปสัญญา</p>
                )}
              </div>

              {/* ตารางสัญญาทั้งหมด */}
              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full table-auto border border-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left">ทำสัญญา</th>
                      <th className="px-4 py-2 text-left">เริ่ม</th>
                      <th className="px-4 py-2 text-left">สิ้นสุด</th>
                      <th className="px-4 py-2 text-left">ค่าเช่า</th>
                      <th className="px-4 py-2 text-left">จำนวนรูป</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(profile.contracts?.length ?? 0) > 0 ? (
                      profile.contracts!.map((c) => (
                        <tr key={c.id} className="border-t">
                          <td className="px-4 py-2">{toThaiDate(c.contractDate)}</td>
                          <td className="px-4 py-2">{toThaiDate(c.startDate)}</td>
                          <td className="px-4 py-2">{toThaiDate(c.endDate)}</td>
                          <td className="px-4 py-2">{c.rentPerMonth?.toLocaleString?.() ?? "-"}</td>
                          <td className="px-4 py-2">{c.contractImages?.length ?? 0}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-4 py-3 text-center text-gray-500">
                          ไม่มีข้อมูลสัญญา
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {activeTab === "password" && (
          <div className="mt-4 bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-[#0F3659]">เปลี่ยนรหัสผ่าน</h3>
              <p className="text-gray-500 mt-1">จัดการรหัสผ่านของคุณได้ที่นี่</p>
            </div>
            <div className="space-y-4">
              <input
                type="password"
                placeholder="รหัสผ่านเดิม"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
              <input
                type="password"
                placeholder="รหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
              <input
                type="password"
                placeholder="ยืนยันรหัสผ่านใหม่"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
              <button
                onClick={handleChangePassword}
                disabled={changingPassword}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {changingPassword ? "กำลังบันทึก..." : "บันทึกรหัสผ่านใหม่"}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ===== Lightbox (ภาพสัญญา) ===== */}
      {lightboxOpen && contractImages.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          {/* ปิด */}
          <button
            title="ปิด"
            aria-label="ปิด"
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow flex items-center justify-center"
            onClick={(e) => {
              e.stopPropagation();
              closeLightbox();
            }}
          >
            <i className="ri-close-line text-xl" />
          </button>

          {/* Prev/Next */}
          {contractImages.length > 1 && (
            <>
              <button
                title="ก่อนหน้า"
                aria-label="ก่อนหน้า"
                className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow flex items-center justify-center"
                onClick={(e) => {
                  e.stopPropagation();
                  showPrev();
                }}
              >
                <i className="ri-arrow-left-s-line text-xl" />
              </button>
              <button
                title="ถัดไป"
                aria-label="ถัดไป"
                className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow flex items-center justify-center"
                onClick={(e) => {
                  e.stopPropagation();
                  showNext();
                }}
              >
                <i className="ri-arrow-right-s-line text-xl" />
              </button>
            </>
          )}

          {/* ภาพใหญ่ */}
          <div
            className="relative w-[90vw] h-[85vh] max-w-none bg-transparent rounded-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={contractImages[currentIndex]}
              alt={`contract-full-${currentIndex + 1}`}
              fill
              className="object-contain"
              sizes="90vw"
              priority
            />
          </div>


          {/* ตัวนับ */}
          {contractImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/90 text-sm">
              {currentIndex + 1} / {contractImages.length}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
