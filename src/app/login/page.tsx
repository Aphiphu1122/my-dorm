"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setErrorMsg(error.message);
    } else {
      router.push("/");
    }
  };

  
  return (
    
    <div className="min-h-screen flex items-center justify-center bg-white px-4">

     <header className="fixed top-0 left-0 right-0 flex justify-between items-center bg-white px-20 py-4 ">

            <div className="flex items-center space-x-2">
              <i className="ri-home-heart-fill text-4xl text-blue-950"></i>
              <h4 className="text-xl text-black font-semibold">Dorm</h4>
            </div>

            <nav>
              <ul className="flex space-x-6 text-gray-700 font-semibold">
                <li>
                  <a href="/about" className="hover:text-blue-950 transition">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="/contact" className="hover:text-blue-950 transition">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="/list-your-place" className="hover:text-blue-950 transition">
                    List Your Place
                  </a>
                </li>
              </ul>
            </nav>
          </header>

      

      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md"
      >
        <h2 className="text-2xl font-bold mb-2 text-center text-gray-800">
          Login
        </h2>


        <h3 className="text-gray-500 mb-5 text-center">Welcome to Dorm</h3>

        {errorMsg && <p className="text-red-600 text-sm mb-4">{errorMsg}</p>}

        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
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
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />
        </div>

          <button
            type="submit"
            disabled={!(email && password)} 
            className={`
              w-full py-2 rounded-md transition
              ${email && password 
                ? 'bg-blue-950 text-white hover:bg-blue-900 cursor-pointer' 
                : 'bg-gray-400 text-white cursor-not-allowed'
              }
            `}
          >
            Login
          </button>
      </form>
    </div>
  );
}
