// src/app/api/profile/update/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { cookies } from "next/headers";
import { z } from "zod";

/** Route นี้ผูกกับคุกกี้ → กันแคชทั้งหมด */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
const noStore = {
  "Cache-Control": "no-store, no-cache, must-revalidate, private",
} as const;

/** Validation schema */
const updateSchema = z.object({
  firstName: z.string().trim().min(1, "กรุณากรอกชื่อ"),
  lastName: z.string().trim().min(1, "กรุณากรอกนามสกุล"),
  phone: z
    .string()
    .trim()
    .regex(/^\d{9,10}$/, "กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง"),
  birthday: z.string().trim().min(1, "กรุณาระบุวันเกิด"),
  address: z.string().trim().min(1, "กรุณากรอกที่อยู่"),
});

export async function PUT(req: Request) {
  try {
    // บางโปรเจกต์ต้องใส่ await เพื่อให้ TS ไม่เตือน
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;
    const role = cookieStore.get("role")?.value;

    if (!userId || role !== "user") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: noStore }
      );
    }

    const json = await req.json().catch(() => ({}));
    const parsed = updateSchema.safeParse(json);
    if (!parsed.success) {
      const msg =
        parsed.error.issues[0]?.message || "กรอกข้อมูลไม่ครบถ้วน/ไม่ถูกต้อง";
      return NextResponse.json(
        { error: msg },
        { status: 400, headers: noStore }
      );
    }

    const { firstName, lastName, phone, birthday, address } = parsed.data;

    // แปลงวันเกิด (รับจาก <input type="date" /> เป็น ISO)
    const bday = new Date(birthday);
    if (isNaN(bday.getTime())) {
      return NextResponse.json(
        { error: "รูปแบบวันเกิดไม่ถูกต้อง" },
        { status: 400, headers: noStore }
      );
    }

    const updated = await db.profile.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        phone,
        birthday: bday,
        address,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        birthday: true,
        address: true,
        nationalId: true,
        isActive: true,
        moveOutDate: true,
        room: { select: { id: true, roomNumber: true } },
        contracts: {
          orderBy: { startDate: "asc" },
          select: {
            id: true,
            startDate: true,
            endDate: true,
            rentPerMonth: true,
            contractImages: true,
            dormOwnerName: true,
            dormAddress: true,
            contractDate: true,
          },
        },
      },
    });

    // ให้ contractImages เป็น array เสมอ
    const contracts = (updated.contracts ?? []).map((c) => ({
      ...c,
      contractImages: Array.isArray(c.contractImages) ? c.contractImages : [],
    }));

    return NextResponse.json(
      {
        message: "อัปเดตสำเร็จ",
        user: {
          ...updated,
          contracts,
          roomId: updated.room?.id ?? null,
          roomNumber: updated.room?.roomNumber ?? null,
        },
      },
      { status: 200, headers: noStore }
    );
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500, headers: noStore }
    );
  }
}
