'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import AboutUsPage from "@/components/about";
import ContactPage from "@/components/contact"; 

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg("");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Login failed");
        return;
      }

      const role = data.user?.role || "user";
      router.push(role === "admin" ? "/admin" : "/home");

    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "An error occurred during login");
    }
  };


   return (
    <div className="min-h-screen flex flex-col items-center bg-white">
      {/* Header */}
      <header className="w-full fixed top-0 left-0 right-0 flex justify-between items-center bg-white px-20 py-4 shadow-md z-50">
        <div className="flex items-center space-x-2">
          <i className="ri-home-heart-fill text-4xl text-blue-950"></i>
          <h4 className="text-xl text-black font-semibold">Dorm</h4>
        </div>
        <nav>
          <ul className="flex space-x-8 text-gray-700 font-semibold">
            <li>
              <button
                onClick={() => setShowAboutModal(true)}
                className="hover:text-blue-950 transition"
              >
                About Us
              </button>
            </li>
            <li>
              <button
                onClick={() => setShowContactModal(true)}
                className="hover:text-blue-950 transition"
              >
                Contact
              </button>
            </li>
          </ul>
        </nav>
      </header>

      {/* Content */}
      <div className="flex flex-col md:flex-row justify-center items-center w-full max-w-6xl mt-24 px-4 py-12 gap-10">
        {/* Left Section */}
        <div className="md:w-1/2 text-center md:text-left space-y-6">
          <h1 className="text-4xl font-bold text-blue-950">Welcome to Dorm</h1>
          <p className="text-gray-600 text-lg">
            Easy-to-use dormitory management system for everyone
          </p>
          <p className="text-gray-700">
            Don&apos;t have an account?{" "}
            <a
              href="/register"
              className="text-blue-600 hover:underline font-semibold"
            >
              Sign up here
            </a>
          </p>
        </div>

        {/* Login Form */}
        <form
          onSubmit={handleLogin}
          className="bg-white p-8 rounded-lg shadow-lg w-full md:w-1/2 max-w-md"
        >
          <h2 className="text-3xl font-bold mb-2 text-center text-gray-800">
            Login
          </h2>
          <h3 className="text-gray-500 mb-5 text-center">
            Sign in to manage your account
          </h3>

          {errorMsg && (
            <p className="text-red-600 text-sm mb-4">{errorMsg}</p>
          )}

          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={!(email && password)}
            className={`w-full py-2 rounded-md transition ${
              email && password
                ? "bg-blue-950 text-white hover:bg-blue-900 cursor-pointer"
                : "bg-gray-400 text-white cursor-not-allowed"
            }`}
          >
            Login
          </button>
        </form>
      </div>

      {/* Modal: About Us */}
      {showAboutModal && (
        <div
          className="fixed inset-0 bg-white bg-opacity-70 flex justify-center items-start pt-20 z-50 overflow-auto"
          onClick={() => setShowAboutModal(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 max-w-3xl w-full mx-4 shadow-lg relative max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowAboutModal(false)}
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 text-3xl font-bold"
              aria-label="Close modal"
            >
              &times;
            </button>
            <AboutUsPage />
          </div>
        </div>
      )}

      {/* Modal: Contact */}
      {showContactModal && (
        <div
          className="fixed inset-0 bg-white bg-opacity-70 flex justify-center items-start pt-20 z-50 overflow-auto"
          onClick={() => setShowContactModal(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 max-w-3xl w-full mx-4 shadow-lg relative max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowContactModal(false)}
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 text-3xl font-bold"
              aria-label="Close modal"
            >
              &times;
            </button>
            <ContactPage />
          </div>
        </div>
      )}
    </div>
  );
}
