"use client";

import { useState, useEffect } from "react";
import { RegisterSchema } from "@/lib/validations/registerSchema";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { v4 as uuidv4 } from "uuid";

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

  const [userId] = useState(uuidv4());
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [availableRooms, setAvailableRooms] = useState<{ id: string; roomNumber: string; status: string }[]>([]);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await fetch("/api/rooms/available");
        const data = await res.json();
        if (res.ok) setAvailableRooms(data.rooms || []);
      } catch (err) {
        console.error("ไม่สามารถโหลดข้อมูลห้อง:", err);
      }
    };
    fetchRooms();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const result = RegisterSchema.safeParse({ ...form, userId, roomId: selectedRoomId });

if (!result.success) {
  const msg = result.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง";
  setError(msg);
  return;
}

try {
  const res = await fetch("/api/registeruser", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...form, userId, roomId: selectedRoomId }),
  });

      const data = await res.json();

      if (!res.ok) {
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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="w-full fixed top-0 left-0 right-0 flex justify-between items-center bg-white px-20 py-4 shadow-md z-50">
        <div className="flex items-center space-x-2">
          <i className="ri-home-heart-fill text-4xl text-blue-950"></i>
          <h4 className="text-xl text-black font-semibold">Dorm</h4>
        </div>
        <nav>
          <ul className="flex space-x-8 text-gray-700 font-semibold">
            <li><a href="/about" className="hover:text-blue-950 transition">About Us</a></li>
            <li><a href="/contact" className="hover:text-blue-950 transition">Contact</a></li>
            <li><a href="/list-your-place" className="hover:text-blue-950 transition">List Your Place</a></li>
          </ul>
        </nav>
      </header>

      {/* Content */}
      <div className="flex flex-col md:flex-row w-full max-w-6xl mx-auto mt-28 px-4 py-12 gap-10">
        <div className="md:w-1/2 space-y-6 text-center md:text-left">
          <h1 className="text-4xl font-bold text-blue-950">Welcome to Dorm</h1>
          <p className="text-gray-600 text-lg">Easy-to-use dormitory management system for everyone</p>
          <p className="text-gray-700">
            Already have an account? <a href="/login" className="text-blue-600 hover:underline font-semibold">Log in here</a>
          </p>
        </div>

        <div className="md:w-1/2">
          <main className="w-full bg-white p-8 rounded-xl shadow-xl">
            <h1 className="text-3xl font-bold mb-2 text-center text-blue-950">Register</h1>
            <h3 className="text-gray-500 mb-6 text-center">Sign up to manage your account</h3>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="flex gap-6">
                <div className="w-1/2">
                  <label className="block mb-1 font-medium text-gray-700">Firstname</label>
                  <input
                    type="text"
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black"
                    placeholder="Enter your firstname"
                    required
                  />
                </div>
                <div className="w-1/2">
                  <label className="block mb-1 font-medium text-gray-700">Lastname</label>
                  <input
                    type="text"
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black"
                    placeholder="Enter your lastname"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 font-medium text-gray-700">Birthdate</label>
                <DatePicker
                  selected={form.birthday ? new Date(form.birthday) : null}
                  onChange={(date: Date | null) =>
                    setForm({
                      ...form,
                      birthday: date ? date.toISOString().split("T")[0] : "",
                    })
                  }
                  dateFormat="yyyy-MM-dd"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  placeholderText="Select your birthdate"
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  wrapperClassName="w-full"
                />
              </div>

              <div>
                <label className="block mb-1 font-medium text-gray-700">National ID card number</label>
                <input
                  type="text"
                  name="nationalId"
                  value={form.nationalId}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black"
                  placeholder="Enter your national ID"
                  required
                />
              </div>

              <div>
                <label className="block mb-1 font-medium text-gray-700">Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black"
                  placeholder="Enter your phone number"
                  required
                />
              </div>

              <div>
                <label className="block mb-1 font-medium text-gray-700">Address</label>
                <input
                  type="text"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black"
                  placeholder="Enter your address"
                  required
                />
              </div>

              <div>
                <label className="block mb-1 font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div>
                <label className="block mb-1 font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  placeholder="Enter your password"
                />
              </div>

              <div>
                <label className="block mb-1 font-medium text-gray-700">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black"
                  placeholder="Confirm your password"
                  required
                />
              </div>

               {/* Fields ทั้งหมดเหมือนเดิม... */}

              {/* 🆕 เลือกห้อง */}
              <div>
                <label className="block mb-1 font-medium text-gray-700">เลือกห้อง</label>
                <select
                  value={selectedRoomId}
                  onChange={(e) => setSelectedRoomId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black"
                  required
                >
                  <option value="">-- เลือกห้อง --</option>
                  {availableRooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      ห้อง {room.roomNumber} {room.status === "AVAILABLE" ? "🟢 ว่าง" : "🔴 ไม่ว่าง"}
                    </option>
                  ))}
                </select>
              </div>

              {error && <p className="text-red-600 text-sm font-medium">{error}</p>}
              {success && <p className="text-green-600 text-sm font-medium">{success}</p>}

              <button
                type="submit"
                disabled={!Object.values(form).every((v) => v.trim() !== "") || !selectedRoomId}
                className={`w-full font-semibold py-2 rounded-lg transition duration-200 ${
                  Object.values(form).every((v) => v.trim() !== "") && selectedRoomId
                    ? "bg-blue-950 text-white hover:bg-blue-900"
                    : "bg-gray-400 text-white cursor-not-allowed"
                }`}
              >
                Sign Up
              </button>
            </form>
          </main>
        </div>
      </div>
    </div>
  );
}