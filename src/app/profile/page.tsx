"use client";

import { useEffect, useState } from "react";

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
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/profile/me", {
          credentials: "include",
        });
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "เกิดข้อผิดพลาด");
          return;
        }

        setProfile(data.user);
        setFormData(data.user);
      } catch (err) {
        console.error(err);
        setError("ไม่สามารถโหลดข้อมูลได้");
      }
    };

    fetchProfile();
  }, []);

  const validate = () => {
    if (!formData.firstName?.trim() || !formData.lastName?.trim()) {
      setError("กรุณากรอกชื่อและนามสกุล");
      return false;
    }
    if (!formData.phone?.match(/^\d{9,10}$/)) {
      setError("กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง");
      return false;
    }
    if (!formData.birthday || isNaN(new Date(formData.birthday).getTime())) {
      setError("กรุณาระบุวันเกิดให้ถูกต้อง");
      return false;
    }
    if (!formData.address?.trim()) {
      setError("กรุณากรอกที่อยู่");
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
        setError(data.error || "เกิดข้อผิดพลาด");
        return;
      }

      setProfile(data.user);
      setEditing(false);
      setSuccess("อัปเดตข้อมูลสำเร็จแล้ว");
    } catch (err) {
      console.error(err);
      setError("เกิดข้อผิดพลาดในการบันทึก");
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (error) return <p className="text-red-500 p-4">{error}</p>;
  if (!profile) return <p className="p-4">กำลังโหลดข้อมูล...</p>;

  const formattedBirthday = new Date(profile.birthday).toLocaleDateString(
    "th-TH",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  );

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-black text-white rounded shadow space-y-4">
      <h2 className="text-2xl font-bold">ข้อมูลส่วนตัว</h2>

      {success && <p className="text-green-400">{success}</p>}

      <div className="space-y-2">
        <div>
          <strong>ชื่อ:</strong>{" "}
          {editing ? (
            <input
              name="firstName"
              value={formData.firstName || ""}
              onChange={handleChange}
              className="text-white p-1 rounded w-full"
            />
          ) : (
            profile.firstName
          )}
        </div>
        <div>
          <strong>นามสกุล:</strong>{" "}
          {editing ? (
            <input
              name="lastName"
              value={formData.lastName || ""}
              onChange={handleChange}
              className="text-white p-1 rounded w-full"
            />
          ) : (
            profile.lastName
          )}
        </div>
        <div>
          <strong>อีเมล:</strong> {profile.email}
        </div>
        <div>
          <strong>เบอร์โทร:</strong>{" "}
          {editing ? (
            <input
              name="phone"
              value={formData.phone || ""}
              onChange={handleChange}
              className="text-white p-1 rounded w-full"
            />
          ) : (
            profile.phone
          )}
        </div>
        <div>
          <strong>วันเกิด:</strong>{" "}
          {editing ? (
            <input
              name="birthday"
              type="date"
              value={formData.birthday?.substring(0, 10) || ""}
              onChange={handleChange}
              className="text-white p-1 rounded w-full"
            />
          ) : (
            formattedBirthday
          )}
        </div>
        <div>
          <strong>ที่อยู่:</strong>{" "}
          {editing ? (
            <textarea
              name="address"
              value={formData.address || ""}
              onChange={handleChange}
              className="text-white p-1 rounded w-full"
            />
          ) : (
            profile.address
          )}
        </div>
        <div>
          <strong>รหัสบัตรประชาชน:</strong> {profile.nationalId}
        </div>
        <div>
          <strong>ห้องพัก:</strong> {profile.room?.roomNumber || "-"}
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
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
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
  );
}
