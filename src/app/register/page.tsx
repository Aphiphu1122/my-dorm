"use client";

import { useEffect, useState } from "react";
import { RegisterSchema } from "@/lib/validations/registerSchema";
import { supabase } from "@/lib/supabaseClient"; // ✅ นำเข้า Supabase Client
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function RegisterPage() {
  const [form, setForm] = useState({
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

  const [supabaseId, setSupabaseId] = useState(""); // ✅ state เก็บ user id
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ✅ ดึง Supabase user
  useEffect(() => {
  const fetchUser = async () => {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.error("เกิดข้อผิดพลาดขณะดึงผู้ใช้จาก Supabase:", error.message);
      return;
    }

    if (user) setSupabaseId(user.id);
  };

  fetchUser();
}, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const result = RegisterSchema.safeParse({ ...form, supabaseId });

    if (!result.success) {
      const msg = result.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง";
      setError(msg);
      return;
    }

    try {
      const response = await fetch("/api/registeruser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          supabaseId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "เกิดข้อผิดพลาด");
      } else {
        setSuccess(data.message || "สมัครสมาชิกสำเร็จ");
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
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("เกิดข้อผิดพลาดที่เซิร์ฟเวอร์");
      }
    }
  };

  return (
    <main className="max-w-md mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">สมัครสมาชิก</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {[{ label: "ชื่อ", name: "firstName" },
          { label: "นามสกุล", name: "lastName" },
          { label: "อีเมล", name: "email", type: "email" },
          { label: "เบอร์โทร", name: "phone" },
          { label: "ที่อยู่", name: "address" },
          { label: "รหัสบัตรประชาชน", name: "nationalId" },
          { label: "รหัสผ่าน", name: "password", type: "password" },
          { label: "ยืนยันรหัสผ่าน", name: "confirmPassword", type: "password" },
        ].map(({ label, name, type }) => (
          <div key={name}>
            <label className="block mb-1 font-medium">{label}</label>
            <input
              type={type || "text"}
              name={name}
              value={form[name as keyof typeof form]}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
        ))}

        <div>
          <label className="block mb-1 font-medium">วันเกิด</label>
          <DatePicker
            selected={form.birthday ? new Date(form.birthday) : null}
            onChange={(date: Date | null) =>
              setForm({
                ...form,
                birthday: date ? date.toISOString().split("T")[0] : "",
              })
            }
            dateFormat="yyyy-MM-dd"
            className="w-full px-3 py-2 border rounded-md"
            placeholderText="เลือกวันเกิด"
            showMonthDropdown
            showYearDropdown
            dropdownMode="select"
          />
        </div>

        {error && <p className="text-red-600">{error}</p>}
        {success && <p className="text-green-600">{success}</p>}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
        >
          สมัครสมาชิก
        </button>
      </form>
    </main>
  );
}
