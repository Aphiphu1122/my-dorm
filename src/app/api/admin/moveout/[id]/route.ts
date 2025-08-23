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

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const role = await getRoleFromCookie();
  if (role !== "admin") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { status } = await req.json();

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return new NextResponse("Invalid status", { status: 400 });
    }

    const request = await db.moveOutRequest.findUnique({
      where: { id: params.id },
      include: {
        room: true,
        user: true,
      },
    });

    if (!request) {
      return new NextResponse("Moveout request not found", { status: 404 });
    }


    const updated = await db.moveOutRequest.update({
      where: { id: params.id },
      data: { status },
    });

    if (status === "APPROVED") {
      await db.room.update({
        where: { id: request.room.id },
        data: { status: "AVAILABLE" },
      });

      await db.profile.update({
        where: { userId: request.user.userId },
        data: {
          room: {
            disconnect: true,
          },
        },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update moveout error:", error);
    return new NextResponse("Failed to update moveout status", { status: 500 });
  }
}
