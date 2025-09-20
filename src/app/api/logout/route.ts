// src/app/api/logout/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const noStore = {
  "Cache-Control": "no-store, no-cache, must-revalidate, private",
} as const;

function clearAuthCookies(res: NextResponse) {
  const base = {
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };

  // คุกกี้ฝั่งเซิร์ฟเวอร์ (httpOnly)
  res.cookies.set("userId", "", { ...base, httpOnly: true, maxAge: 0 });
  res.cookies.set("role", "", { ...base, httpOnly: true, maxAge: 0 });

  // คุกกี้ฝั่ง client ที่ใช้แค่โชว์ UI
  res.cookies.set("loggedIn", "", { ...base, httpOnly: false, maxAge: 0 });

  return res;
}

export async function POST() {
  const res = NextResponse.json({ message: "Logged out" }, { headers: noStore });
  return clearAuthCookies(res);
}

// เผื่อบางที่เรียกด้วย GET
export async function GET() {
  const res = NextResponse.json({ message: "Logged out" }, { headers: noStore });
  return clearAuthCookies(res);
}
