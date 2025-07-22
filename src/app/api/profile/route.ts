// app/api/profile/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // ต้องใช้ Service Role Key เพื่อดึงข้อมูล user ได้
);

// 🔹 POST: Create user profile
export async function POST(req: Request) {
  const body = await req.json();
  const { email, firstName, lastName, phone, birthday, address, nationalId } = body;

  try {
    const existing = await prisma.userProfile.findUnique({ where: { email } });

    if (existing) {
      return NextResponse.json({ message: "Profile already exists" }, { status: 409 });
    }

    const profile = await prisma.userProfile.create({
      data: {
        email,
        firstName,
        lastName,
        phone,
        birthday: birthday ? new Date(birthday) : undefined,
        address,
        nationalId,
      },
    });

    return NextResponse.json({ message: "Profile created", profile });
  } catch (error) {
    console.error("POST /api/profile error:", error);
    return NextResponse.json({ message: "Failed to create profile" }, { status: 500 });
  }
}

// 🔹 PUT: Update user profile
export async function PUT(req: Request) {
  const body = await req.json();
  const { email, ...data } = body;

  try {
    const updated = await prisma.userProfile.update({
      where: { email },
      data: {
        ...data,
        birthday: data.birthday ? new Date(data.birthday) : undefined,
      },
    });

    return NextResponse.json({ message: "Profile updated", updated });
  } catch (error) {
    console.error("PUT /api/profile error:", error);
    return NextResponse.json({ message: "Failed to update profile" }, { status: 500 });
  }
}

// 🔹 GET: Get profile from logged-in Supabase user
export async function GET(req: Request) {
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return NextResponse.json({ message: "No token provided" }, { status: 401 });
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return NextResponse.json({ message: "Invalid token" }, { status: 401 });
  }

  try {
    const profile = await prisma.userProfile.findUnique({
      where: { email: user.email! },
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
