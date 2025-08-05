"use client";

import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center min-h-screen bg-white text-black">
      <button
        onClick={() => router.push("/login")}
        className="px-6 py-3 bg-blue-600 text-white text-lg rounded hover:bg-blue-700 transition"
      >
        ไปหน้า Login
      </button>
    </div>
  );
}
