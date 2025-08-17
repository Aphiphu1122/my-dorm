"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/sidebar";

type UserProfile = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthday: string;
  address: string;
  nationalId: string;
  room?: {
    roomNumber: string;
  };
};

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
    try {
      const res = await fetch("/api/profile/me", {
        credentials: "include",
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
        return;
      }

          setProfile(data);
          setFormData(data);
        } catch (err) {
          console.error(err);
          toast.error("ไม่สามารถโหลดข้อมูลได้");
        }
      };

    fetchProfile();
  }, []);

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
    setSuccess("");

    if (!validate()) return;

    try {
      const res = await fetch("/api/profile/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          birthday: formData.birthday,
          address: formData.address,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "เกิดข้อผิดพลาดในการอัปเดตข้อมูล");
        return;
      }

      setProfile(data.user);
      setEditing(false);
      toast.success("อัปเดตข้อมูลสำเร็จแล้ว");
    } catch (err) {
      console.error(err);
      toast.error("เกิดข้อผิดพลาดในการบันทึก");
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error("กรุณากรอกข้อมูลให้ครบทุกช่อง");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("รหัสผ่านใหม่ไม่ตรงกัน");
      return;
    }

    setChangingPassword(true);
    try {
      const res = await fetch("/api/profile/change-password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword, newPassword, confirmPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("เปลี่ยนรหัสผ่านสำเร็จ");
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => router.push("/home"), 1000);
      } else {
        if (data.error?.oldPassword) toast.error(data.error.oldPassword[0]);
        else if (data.error?.confirmPassword)
          toast.error(data.error.confirmPassword[0]);
        else toast.error(data.error || "เปลี่ยนรหัสผ่านไม่สำเร็จ");
      }
    } catch (err) {
      console.error("Change password error:", err);
      toast.error("เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (error)
    return <p className="text-red-600 text-center mt-4 font-medium">{error}</p>;
  if (!profile) return <p className="text-center mt-4">กำลังโหลดข้อมูล...</p>;

  const formattedBirthday = new Date(profile.birthday).toLocaleDateString(
    "th-TH",
    { day: "2-digit", month: "long", year: "numeric" }
  );

  return (
    <div className="flex min-h-screen bg-white text-black">
      {/* Sidebar ซ้าย */}
      <aside className="w-64 border-r border-gray-200 sticky top-0 h-screen">
        {/* ผู้ใช้ธรรมดาใช้ role="user" ถ้าหน้านี้อยู่ฝั่งผู้ใช้ */}
        <Sidebar role="user" />
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
          <h2 className="text-2xl font-bold border-b pb-2">ข้อมูลส่วนตัว</h2>

          {success && <p className="text-green-600 font-medium">{success}</p>}

          <div className="space-y-3">
            <div>
              <label className="font-semibold">ชื่อ:</label>
              {editing ? (
                <input
                  name="firstName"
                  value={formData.firstName || ""}
                  onChange={handleChange}
                  className="w-full border p-2 rounded"
                />
              ) : (
                <span className="ml-2">{profile.firstName}</span>
              )}
            </div>

            <div>
              <label className="font-semibold">นามสกุล:</label>
              {editing ? (
                <input
                  name="lastName"
                  value={formData.lastName || ""}
                  onChange={handleChange}
                  className="w-full border p-2 rounded"
                />
              ) : (
                <span className="ml-2">{profile.lastName}</span>
              )}
            </div>

            <div>
              <label className="font-semibold">อีเมล:</label>
              <span className="ml-2">{profile.email}</span>
            </div>

            <div>
              <label className="font-semibold">เบอร์โทร:</label>
              {editing ? (
                <input
                  name="phone"
                  value={formData.phone || ""}
                  onChange={handleChange}
                  className="w-full border p-2 rounded"
                />
              ) : (
                <span className="ml-2">{profile.phone}</span>
              )}
            </div>

            <div>
              <label className="font-semibold">วันเกิด:</label>
              {editing ? (
                <input
                  name="birthday"
                  type="date"
                  value={formData.birthday?.substring(0, 10) || ""}
                  onChange={handleChange}
                  className="w-full border p-2 rounded"
                />
              ) : (
                <span className="ml-2">{formattedBirthday}</span>
              )}
            </div>

            <div>
              <label className="font-semibold">ที่อยู่:</label>
              {editing ? (
                <textarea
                  name="address"
                  value={formData.address || ""}
                  onChange={handleChange}
                  className="w-full border p-2 rounded"
                />
              ) : (
                <span className="ml-2">{profile.address}</span>
              )}
            </div>

            <div>
              <label className="font-semibold">รหัสบัตรประชาชน:</label>
              <span className="ml-2">{profile.nationalId}</span>
            </div>

            <div>
              <label className="font-semibold">ห้องพัก:</label>
              <span className="ml-2">{profile.room?.roomNumber || "-"}</span>
            </div>
          </div>

          <div className="pt-4">
            {editing ? (
              <>
                <button
                  onClick={handleSave}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded mr-2"
                >
                  บันทึก
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
                >
                  ยกเลิก
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              >
                แก้ไขข้อมูล
              </button>
            )}
          </div>
        </div>

        {/* Change Password */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-semibold mb-4">เปลี่ยนรหัสผ่าน</h3>
          <div className="space-y-3">
            <input
              type="password"
              placeholder="รหัสผ่านเดิม"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full border p-2 rounded"
            />
            <input
              type="password"
              placeholder="รหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border p-2 rounded"
            />
            <input
              type="password"
              placeholder="ยืนยันรหัสผ่านใหม่"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border p-2 rounded"
            />
            <button
              onClick={handleChangePassword}
              disabled={changingPassword}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded disabled:opacity-60"
            >
              {changingPassword ? "กำลังบันทึก..." : "บันทึกรหัสผ่านใหม่"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
