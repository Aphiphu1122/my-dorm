import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function checkAdminAuth() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;
  const role = cookieStore.get("role")?.value;

  if (!userId || role !== "admin") {
    return NextResponse.json({ error: "Unauthorized (Admin only)" }, { status: 401 });
  }

  return userId;
}