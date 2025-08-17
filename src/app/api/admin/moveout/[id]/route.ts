import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getRoleFromCookie } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const role = await getRoleFromCookie();
  if (role !== "admin") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const request = await db.moveOutRequest.findUnique({
      where: { id: params.id },
      include: {
        user: true,
        room: true,
      },
    });

    if (!request) {
      return new NextResponse("Not found", { status: 404 });
    }

    return NextResponse.json(request);
  } catch (error) {
    console.error("Fetch moveout error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}