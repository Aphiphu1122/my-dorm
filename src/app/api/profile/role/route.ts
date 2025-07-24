// src/app/api/profile/role/route.ts
import { db } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { userId } = await req.json();

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  try {
    const profile = await db.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ role: profile.role });
  } catch (error) {
    console.error("❌ Role API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
