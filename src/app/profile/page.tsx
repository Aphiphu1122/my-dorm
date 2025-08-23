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

  const [activeTab, setActiveTab] = useState<"personal" | "password">("personal"); 

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/profile/me", { credentials: "include" });
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
      } else {
        toast.error(data.error || "เปลี่ยนรหัสผ่านไม่สำเร็จ");
      }
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

  if (error) return <p className="text-red-600 text-center mt-4 font-medium">{error}</p>;
  if (!profile) return <p className="text-center mt-4">กำลังโหลดข้อมูล...</p>;

  const formattedBirthday = new Date(profile.birthday).toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-200 sticky top-0 h-screen">
        <Sidebar role="user" />
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 max-w-5xl mx-auto">
        <div>
          <h3 className="text-3xl font-bold mb-1 text-[#0F3659]">Change Profile</h3>
          <p className="text-gray-500 mb-8">You can manage your personal information and passwords here.</p>
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
            Personal Information
          </button>
          <button
            onClick={() => setActiveTab("password")}
            className={`px-6 py-2 font-semibold ${
              activeTab === "password"
                ? "border-b-4 border-[#0F3659] text-[#0F3659]"
                : "text-gray-500 hover:text-gray-600"
            } transition`}
          >
            Change Password
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "personal" && (
          <div className="space-y-3 ">
            {success && <p className="text-green-600 font-medium">{success}</p>}

            <div className="bg-white shadow-md rounded-lg flex justify-between py-3 px-4 text-gray-700 hover:transition duration-200 transform hover:scale-103">
              <label className="font-semibold">First Name</label>
              {editing ? (
                <input
                  name="firstName"
                  value={formData.firstName || ""}
                  onChange={handleChange}
                  className="w-1/2 border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              ) : (
                <span>{profile.firstName}</span>
              )}
            </div>

            <div className="bg-white shadow-md rounded-lg flex justify-between py-3 px-4 text-gray-700 hover:transition duration-200 transform hover:scale-103">
              <label className="font-semibold">Last Name</label>
              {editing ? (
                <input
                  name="lastName"
                  value={formData.lastName || ""}
                  onChange={handleChange}
                  className="w-1/2 border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              ) : (
                <span>{profile.lastName}</span>
              )}
            </div>

            <div className="bg-white shadow-md rounded-lg flex justify-between py-3 px-4 text-gray-700 hover:transition duration-200 transform hover:scale-103">
              <label className="font-semibold">Email</label>
              <span>{profile.email}</span>
            </div>

            <div className="bg-white shadow-md rounded-lg flex justify-between py-3 px-4 text-gray-700 hover:transition duration-200 transform hover:scale-103">
              <label className="font-semibold">Phone Number</label>
              {editing ? (
                <input
                  name="phone"
                  value={formData.phone || ""}
                  onChange={handleChange}
                  className="w-1/2 border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              ) : (
                <span>{profile.phone}</span>
              )}
            </div>

            <div className="bg-white shadow-md rounded-lg flex justify-between py-3 px-4 text-gray-700 hover:transition duration-200 transform hover:scale-103">
              <label className="font-semibold">Birthdate</label>
              {editing ? (
                <input
                  name="birthday"
                  type="date"
                  value={formData.birthday?.substring(0, 10) || ""}
                  onChange={handleChange}
                  className="w-1/2 border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              ) : (
                <span>{formattedBirthday}</span>
              )}
            </div>

            <div className="bg-white shadow-md rounded-lg flex justify-between py-3 px-4 text-gray-700 hover:transition duration-200 transform hover:scale-103">
              <label className="font-semibold">Address</label>
              {editing ? (
                <textarea
                  name="address"
                  value={formData.address || ""}
                  onChange={handleChange}
                  className="w-1/2 border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              ) : (
                <span>{profile.address}</span>
              )}
            </div>

            <div className="bg-white shadow-md rounded-lg flex justify-between py-3 px-4 text-gray-700 hover:transition duration-200 transform hover:scale-103">
              <label className="font-semibold">National ID</label>
              <span>{profile.nationalId}</span>
            </div>

            <div className="bg-white shadow-md rounded-lg flex justify-between py-3 px-4 text-gray-700 hover:transition duration-200 transform hover:scale-103">
              <label className="font-semibold">Room Number</label>
              <span>{profile.room?.roomNumber || "-"}</span>
            </div>
            
            <div className="flex justify-end mt-4 gap-4">
              {editing ? (
                <>
                  <button
                    onClick={handleSave}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded transition"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="bg-gray-400 hover:bg-gray-500 text-white px-8 py-2 rounded transition"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="bg-gray-400 hover:bg-gray-500 text-white px-8 py-2 rounded transition"
                >
                  Edit
                </button>
              )}
            </div>

          </div>
        )}

        {activeTab === "password" && (
          <div className="mt-4 bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-[#0F3659]">Change Password</h3>
              <p className="text-gray-500 mt-1">Manage your passwords securely here.</p>
            </div>
            <div className="space-y-4">
              <input
                type="password"
                placeholder="Old password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
              <input
                type="password"
                placeholder="New password (at least 6 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
              <button
                onClick={handleChangePassword}
                disabled={changingPassword}
                className="w-full bg-gray-400 hover:bg-blue-500 text-white font-semibold px-4 py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {changingPassword ? "Saving..." : "Save New Password"}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
