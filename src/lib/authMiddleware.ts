import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/** ใช้กับทุก response ของเส้นทางที่ผูก cookie */
const noStore = {
  "Cache-Control": "no-store, no-cache, must-revalidate, private",
} as const;

/** ตรวจสิทธิ์แอดมิน: ผ่านแล้วคืน userId, ไม่ผ่านคืน NextResponse */
export async function checkAdminAuthOrReject(): Promise<string | NextResponse> {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value ?? null;
  const role = cookieStore.get("role")?.value ?? null;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: noStore });
  }
  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden (Admin only)" }, { status: 403, headers: noStore });
  }
  return userId;
}

/** (ถ้าต้องการ) ตรวจสิทธิ์ผู้ใช้ทั่วไป */
export async function checkUserAuthOrReject(): Promise<string | NextResponse> {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value ?? null;
  const role = cookieStore.get("role")?.value ?? null;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: noStore });
  }
  if (role !== "user") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: noStore });
  }
  return userId;
}
