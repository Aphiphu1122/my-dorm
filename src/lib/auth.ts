// src/lib/auth.ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export type Role = "admin" | "user";
export type AuthResult = NextResponse | { userId: string };

const noStore = {
  "Cache-Control": "no-store, no-cache, must-revalidate, private",
} as const;

/** ดึง userId จากคุกกี้ */
export async function getUserIdFromCookie(): Promise<string | null> {
  const c = await cookies();
  return c.get("userId")?.value ?? null;
}

/** ดึง role จากคุกกี้ (จำกัดให้เป็น union ที่รู้จัก) */
export async function getRoleFromCookie(): Promise<Role | null> {
  const c = await cookies();
  const r = c.get("role")?.value;
  return r === "admin" || r === "user" ? r : null;
}

/** true เมื่อเป็น admin */
export async function checkAdminRole(): Promise<boolean> {
  const role = await getRoleFromCookie();
  return role === "admin";
}

function unauthorized(): NextResponse {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: noStore });
}

/** เช็กสิทธิ์ admin: คืน NextResponse เมื่อไม่ผ่าน หรือคืน { userId } เมื่อผ่าน */
export async function checkAdminAuthOrReject(): Promise<AuthResult> {
  const c = await cookies();
  const userId = c.get("userId")?.value ?? null;
  const role = c.get("role")?.value ?? null;
  if (!userId || role !== "admin") return unauthorized();
  return { userId };
}

/** เช็กสิทธิ์ user: คืน NextResponse เมื่อไม่ผ่าน หรือคืน { userId } เมื่อผ่าน */
export async function checkUserAuthOrReject(): Promise<AuthResult> {
  const c = await cookies();
  const userId = c.get("userId")?.value ?? null;
  const role = c.get("role")?.value ?? null;
  if (!userId || role !== "user") return unauthorized();
  return { userId };
}
