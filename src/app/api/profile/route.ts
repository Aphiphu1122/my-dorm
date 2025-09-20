// src/app/api/profile/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/prisma";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** ===== Runtime & Caching ===== */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const noStore = {
  "Cache-Control": "no-store, no-cache, must-revalidate, private",
} as const;

/** ===== Supabase (optional: ใช้เมื่อมี Bearer token) ===== */
const supabase: SupabaseClient | null =
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )
    : null;

/** ---- Prisma selection types ---- */
type ContractDb = {
  id: string;
  startDate: Date;
  endDate: Date;
  rentPerMonth: number;
  contractImages: string[] | null;
  dormOwnerName: string | null;
  dormAddress: string | null;
  contractDate: Date | null;
};

/** ---- helpers ---- */
async function getAuthFromRequest(req: Request) {
  // โปรเจกต์ของคุณต้อง await
  const cookieStore = await cookies();
  const cookieUserId = cookieStore.get("userId")?.value ?? null;
  const cookieRole = cookieStore.get("role")?.value ?? null;

  const bearer = req.headers.get("Authorization")?.replace("Bearer ", "") || null;
  let bearerEmail: string | null = null;

  if (bearer && supabase) {
    try {
      const { data, error } = await supabase.auth.getUser(bearer);
      if (!error && data?.user?.email) bearerEmail = data.user.email;
    } catch {
      // ignore
    }
  }

  return { cookieUserId, cookieRole, bearerEmail };
}

/** ปรับให้ไม่ใช้ any */
function normalizeContracts(
  contracts?: readonly ContractDb[] | null
): ContractDb[] {
  return (contracts ?? []).map((c) => ({
    ...c,
    contractImages: Array.isArray(c.contractImages) ? c.contractImages : [],
  }));
}

/** ================= POST: create profile (admin only) ================= */
export async function POST(req: Request) {
  try {
    const { cookieRole } = await getAuthFromRequest(req);
    if (cookieRole !== "admin") {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401, headers: noStore }
      );
    }

    const body = await req.json();
    const {
      email,
      firstName,
      lastName,
      phone,
      birthday,
      address,
      nationalId,
      password,
      userId,
      role = "user",
    } = body ?? {};

    if (
      !email ||
      !firstName ||
      !lastName ||
      !phone ||
      !birthday ||
      !address ||
      !nationalId ||
      !password ||
      !userId
    ) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400, headers: noStore }
      );
    }

    const existing = await db.profile.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { message: "Profile already exists" },
        { status: 409, headers: noStore }
      );
    }

    const bcrypt = await import("bcryptjs");
    const hashedPassword = await bcrypt.hash(password, 12);

    const created = await db.profile.create({
      data: {
        email,
        firstName,
        lastName,
        phone,
        birthday: new Date(birthday),
        address,
        nationalId,
        password: hashedPassword,
        userId,
        role,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        birthday: true,
        address: true,
        nationalId: true,
        role: true,
        isActive: true,
        moveOutDate: true,
      },
    });

    return NextResponse.json(
      { message: "Profile created", profile: created },
      { headers: noStore }
    );
  } catch (error) {
    console.error("POST /api/profile error:", error);
    return NextResponse.json(
      { message: "Failed to create profile" },
      { status: 500, headers: noStore }
    );
  }
}

/** ================= PUT: update โปรไฟล์ของผู้ใช้ (Bearer หรือ Cookie) ================= */
export async function PUT(req: Request) {
  try {
    const { bearerEmail, cookieUserId } = await getAuthFromRequest(req);
    if (!bearerEmail && !cookieUserId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401, headers: noStore }
      );
    }

    const body = await req.json();
    const { firstName, lastName, phone, birthday, address } = body ?? {};

    const commonSelect = {
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      birthday: true,
      address: true,
      nationalId: true,
      isActive: true,
      moveOutDate: true,
      room: { select: { roomNumber: true } },
      contracts: {
        orderBy: { startDate: "asc" as const },
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
    };

    // เลือกวิธีระบุตัวตน
    const updated =
      bearerEmail
        ? await db.profile.update({
            where: { email: bearerEmail },
            data: {
              firstName,
              lastName,
              phone,
              address,
              birthday: birthday ? new Date(birthday) : undefined,
              updatedAt: new Date(),
            },
            select: commonSelect,
          })
        : await db.profile.update({
            where: { id: cookieUserId! },
            data: {
              firstName,
              lastName,
              phone,
              address,
              birthday: birthday ? new Date(birthday) : undefined,
              updatedAt: new Date(),
            },
            select: commonSelect,
          });

    // ✅ แคสต์เป็น ContractDb[] (ไม่ใช่ any)
    const normalized = normalizeContracts(
      updated.contracts as unknown as ContractDb[]
    );

    return NextResponse.json(
      { message: "Profile updated", user: { ...updated, contracts: normalized } },
      { headers: noStore }
    );
  } catch (error) {
    console.error("PUT /api/profile error:", error);
    return NextResponse.json(
      { message: "Failed to update profile" },
      { status: 500, headers: noStore }
    );
  }
}

/** ================= GET: ดึงโปรไฟล์ (พร้อม room + contracts) ================= */
export async function GET(req: Request) {
  try {
    const { bearerEmail, cookieUserId } = await getAuthFromRequest(req);
    if (!bearerEmail && !cookieUserId) {
      return NextResponse.json(
        { message: "No/Invalid token" },
        { status: 401, headers: noStore }
      );
    }

    const profile = await db.profile.findFirst({
      where: bearerEmail ? { email: bearerEmail } : { id: cookieUserId! },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        birthday: true,
        address: true,
        nationalId: true,
        isActive: true,
        moveOutDate: true,
        room: { select: { roomNumber: true } },
        contracts: {
          orderBy: { startDate: "asc" as const },
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

    if (!profile) {
      return NextResponse.json(
        { message: "Profile not found" },
        { status: 404, headers: noStore }
      );
    }

    const normalized = normalizeContracts(
      profile.contracts as unknown as ContractDb[]
    );

    return NextResponse.json(
      { ...profile, contracts: normalized },
      { headers: noStore }
    );
  } catch (error) {
    console.error("GET /api/profile error:", error);
    return NextResponse.json(
      { message: "Failed to fetch profile" },
      { status: 500, headers: noStore }
    );
  }
}
