// src/app/api/profile/role/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { db } from "@/lib/prisma";

/** Runtime & caching (ข้อมูลผูกกับผู้ใช้) */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const noStore = {
  "Cache-Control": "no-store, no-cache, must-revalidate, private",
} as const;

const BodySchema = z.object({
  // optional: อนุญาตให้ส่ง userId มาได้ เฉพาะกรณี admin จะดึง role ของคนอื่น
  userId: z.string().min(1).optional(),
});

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const cookieUserId = cookieStore.get("userId")?.value || null;
    const cookieRole = cookieStore.get("role")?.value || null;

    if (!cookieUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: noStore });
    }

    // parse body อย่างปลอดภัย (รองรับไม่มี body)
    let body: unknown = {};
    try {
      body = await req.json();
    } catch {
    }
    const parsed = BodySchema.safeParse(body);

    const requestedUserId = parsed.success ? parsed.data.userId : undefined;

    // ถ้าเป็น admin และมีการระบุ userId -> อนุญาตดู role ของคนอื่น
    // มิฉะนั้น ใช้ userId จากคุกกี้เสมอ (กันการสวมรอย)
    const targetUserId = cookieRole === "admin" && requestedUserId ? requestedUserId : cookieUserId;

    // ให้สอดคล้องกับ /api/profile/me: ใช้ where: { id: targetUserId }
    const profile = await db.profile.findUnique({
      where: { id: targetUserId },
      select: { role: true },
    });

    if (!profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404, headers: noStore });
    }

    return NextResponse.json({ role: profile.role }, { headers: noStore });
  } catch (error) {
    console.error("❌ Role API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: noStore });
  }
}
