import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getRoleFromCookie } from "@/lib/auth";

export async function GET() {
  try {
    const role = await getRoleFromCookie();
    if (role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const moveOutRequests = await db.moveOutRequest.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: true,
        room: true,
      },
    });

    return NextResponse.json(moveOutRequests);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}