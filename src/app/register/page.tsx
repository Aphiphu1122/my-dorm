"use client";

import { useEffect, useState } from "react";
import { RegisterSchema } from "@/lib/validations/registerSchema";
import { supabase } from "@/lib/supabaseClient";
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

  const [supabaseId, setSupabaseId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
        body: JSON.stringify({ ...form, supabaseId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "เกิดข้อผิดพลาด");
      } else {
        setSuccess(data.message || "สมัครสมาชิกสำเร็จ");
        setForm({
          firstName: "",
          lastName: "",
          phone: "",
          birthday: "",
          address: "",
          nationalId: "",
          email: "",
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

  const isFormComplete = Object.values(form).every((value) => value.trim() !== "");

  return (
    <>
     <div className="bg-white min-h-screen">
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
    <div className="flex flex-col md:flex-row w-full  max-w-6xl mx-auto mt-17 px-4 py-12 gap-10">
      
      {/* Left Side */}
       <div className="md:w-1/2 md:sticky md:top-70 self-start text-center md:text-left space-y-6">
        <h1 className="text-4xl font-bold text-blue-950">Welcome to Dorm</h1>
        <p className="text-gray-600 text-lg">
          Easy-to-use dormitory management system for everyone
        </p>
        <p className="text-gray-700">
          Already have an account?{" "}
          <a href="/login" className="text-blue-600 hover:underline font-semibold">
            Log in here
          </a>
        </p>
      </div>

      {/* Right Side: Form */}
      <div className="md:w-1/2">
        <main className="w-full bg-white p-8 rounded-xl shadow-xl">
          <h1 className="text-3xl font-bold mb-2 text-center text-blue-950">Register</h1>
          <h3 className="text-gray-500 mb-6 text-center">  Sign up to manage your account</h3>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* ชื่อ */}
            <div className="flex gap-6">
              <div className="w-1/2">
                <label className="block mb-1 font-medium text-gray-700">Firstname</label>
                <input
                  type="text"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  required
                  placeholder="Enter your firstName"
                  className="w-full test-gray-700 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="w-1/2">
                <label className="block mb-1 font-medium text-gray-700">Lastname</label>
                <input
                  type="text"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  required
                  placeholder="Enter your lastname"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            

            {/* Birthdate */}
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholderText="Select your birthdate"
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
                wrapperClassName="w-full"
              />
            </div>

            {/* National ID card number */}
            <div>
              <label className="block mb-1 font-medium text-gray-700">National ID card number</label>
              <input
                type="text"
                name="nationalId"
                value={form.nationalId}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your national id card number"
              />
            </div>

            {/* Phone number */}
            <div>
              <label className="block mb-1 font-medium text-gray-700">Phone number</label>
              <input
                type="text"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your phone number"
              />
            </div>

            {/* Address */}
            <div>
              <label className="block mb-1 font-medium text-gray-700">Address</label>
              <input
                type="text"
                name="address"
                value={form.address}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your address"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block mb-1 font-medium text-gray-700">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your email"
              />
            </div>

              {/* Password */}
              <div >
                <label className="block mb-1 font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your password "
                />
              </div>

              {/* Confirm password */}
              <div >
                <label className="block mb-1 font-medium text-gray-700">Confirm password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your Confirm password "
              />
              </div>
            {/* แสดง error/success */}
            {error && <p className="text-red-600 font-medium">{error}</p>}
            {success && <p className="text-green-600 font-medium">{success}</p>}

            <button
              type="submit"
              disabled={!Object.values(form).every((v) => v.trim() !== "")}
              className={`w-full font-semibold py-2 rounded-lg transition duration-200 ${
                Object.values(form).every((v) => v.trim() !== "")
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
    </>
  );
}
