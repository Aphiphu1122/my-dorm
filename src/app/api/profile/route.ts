// api/profile/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
// แนะนำใช้ตัวเดียวกับที่ใช้ทั่วโปรเจกต์ เช่น: import { db } from "@/lib/prisma"
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ---- helper: ดึง user จาก Authorization: Bearer <token> ----
async function getUserFromReq(req: Request) {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error) return null;
  return data.user ?? null;
}

/** ================= POST: create profile ================= */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      email, firstName, lastName, phone, birthday, address,
      nationalId, password, userId, role = "user",
    } = body;

    const existing = await prisma.profile.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ message: "Profile already exists" }, { status: 409 });
    }

    // !! อย่าคืน password กลับ
    const bcrypt = await import("bcryptjs");
    const hashedPassword = await bcrypt.hash(password, 10);

    const created = await prisma.profile.create({
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
        id: true, email: true, firstName: true, lastName: true, phone: true,
        birthday: true, address: true, nationalId: true, role: true,
        isActive: true, moveOutDate: true,
      },
    });

    return NextResponse.json({ message: "Profile created", profile: created });
  } catch (error) {
    console.error("POST /api/profile error:", error);
    return NextResponse.json({ message: "Failed to create profile" }, { status: 500 });
  }
}

/** ================= PUT: update โปรไฟล์ของ user ปัจจุบัน ================= */
export async function PUT(req: Request) {
  try {
    const user = await getUserFromReq(req);
    if (!user?.email) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    const body = await req.json();
    const { firstName, lastName, phone, birthday, address } = body;

    const updated = await prisma.profile.update({
      where: { email: user.email },
      data: {
        firstName,
        lastName,
        phone,
        address,
        birthday: birthday ? new Date(birthday) : undefined,
      },
      // คืนข้อมูลให้พอกับหน้า FE ใช้งาน (ห้อง + สัญญา)
      select: {
        firstName: true, lastName: true, email: true, phone: true,
        birthday: true, address: true, nationalId: true,
        isActive: true, moveOutDate: true,
        room: { select: { roomNumber: true } },
        contracts: {
          orderBy: { startDate: "asc" },
          select: {
            id: true, startDate: true, endDate: true, rentPerMonth: true,
            contractImages: true, dormOwnerName: true, dormAddress: true, contractDate: true,
          },
        },
      },
    });

    // FE ของคุณคาดรูปแบบ { user: ... }
    return NextResponse.json({ message: "Profile updated", user: updated });
  } catch (error) {
    console.error("PUT /api/profile error:", error);
    return NextResponse.json({ message: "Failed to update profile" }, { status: 500 });
  }
}

/** ================= GET: ดึงโปรไฟล์ (พร้อม room + contracts) ================= */
export async function GET(req: Request) {
  try {
    const user = await getUserFromReq(req);
    if (!user?.email) {
      return NextResponse.json({ message: "No/Invalid token" }, { status: 401 });
    }

    const profile = await prisma.profile.findUnique({
      where: { email: user.email },
      select: {
        firstName: true, lastName: true, email: true, phone: true,
        birthday: true, address: true, nationalId: true,
        isActive: true, moveOutDate: true,
        room: { select: { roomNumber: true } },
        contracts: {
          orderBy: { startDate: "asc" },
          select: {
            id: true, startDate: true, endDate: true, rentPerMonth: true,
            contractImages: true, dormOwnerName: true, dormAddress: true, contractDate: true,
          },
        },
      },
    });

    if (!profile) {
      return NextResponse.json({ message: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error("GET /api/profile error:", error);
    return NextResponse.json({ message: "Failed to fetch profile" }, { status: 500 });
  }
}
