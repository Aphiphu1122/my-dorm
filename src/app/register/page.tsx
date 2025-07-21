"use client";
import { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function RegisterPage() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    birthday: "", // YYYY-MM-DD
    address: "",
    nationalId: "",
    password: "",
    confirmPassword: "",
  });

  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      setMessage("รหัสผ่านไม่ตรงกัน");
      return;
    }

    try {
      const res = await fetch("/api/registeruser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      let data;
      try {
        data = await res.json();
      } catch (jsonErr) {
        console.error("❌ ไม่สามารถแปลง JSON ได้:", jsonErr);
        setMessage("เกิดข้อผิดพลาดในการประมวลผลข้อมูลจากเซิร์ฟเวอร์");
        return;
      }

      if (res.ok) {
        setMessage("ส่งคำขอสมัครเรียบร้อยแล้ว รอการอนุมัติจากแอดมิน");
        setForm({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          birthday: "",
          address: "",
          nationalId: "",
          password: "",
          confirmPassword: "",
        });
      } else {
        setMessage(data?.error || "เกิดข้อผิดพลาด");
      }
    } catch (err) {
      console.error("❌ สมัครสมาชิกล้มเหลว:", err);
      setMessage("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold mb-4 text-white">สมัครสมาชิก</h1>

      <input
        type="text"
        placeholder="First name"
        value={form.firstName}
        onChange={(e) => setForm({ ...form, firstName: e.target.value })}
        required
        className="border p-2 w-full bg-white text-black"
      />
      <input
        type="text"
        placeholder="Last name"
        value={form.lastName}
        onChange={(e) => setForm({ ...form, lastName: e.target.value })}
        required
        className="border p-2 w-full bg-white text-black"
      />
      <input
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        required
        className="border p-2 w-full bg-white text-black"
      />
      <input
        type="tel"
        placeholder="Phone"
        value={form.phone}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
        required
        className="border p-2 w-full bg-white text-black"
      />
      <div>
        <label className="block text-sm font-medium mb-1 text-white">วันเกิด</label>
        <DatePicker
          selected={form.birthday ? new Date(form.birthday) : null}
          onChange={(date) =>
            setForm({
              ...form,
              birthday: date?.toISOString().split("T")[0] || "",
            })
          }
          dateFormat="yyyy-MM-dd"
          placeholderText="เลือกวันเกิด"
          className="border p-2 w-full bg-white text-black"
          showMonthDropdown
          showYearDropdown
          dropdownMode="select"
        />
      </div>
      <textarea
        placeholder="Address"
        value={form.address}
        onChange={(e) => setForm({ ...form, address: e.target.value })}
        required
        className="border p-2 w-full bg-white text-black"
      />
      <input
        type="text"
        placeholder="National ID"
        value={form.nationalId}
        onChange={(e) => setForm({ ...form, nationalId: e.target.value })}
        required
        className="border p-2 w-full bg-white text-black"
      />
      <input
        type="password"
        placeholder="Password"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        required
        className="border p-2 w-full bg-white text-black"
      />
      <input
        type="password"
        placeholder="Confirm password"
        value={form.confirmPassword}
        onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
        required
        className="border p-2 w-full bg-white text-black"
      />

      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
        ส่งคำขอสมัคร
      </button>

      {message && <p className="text-sm text-center text-green-400 mt-2">{message}</p>}
    </form>
  );
}
