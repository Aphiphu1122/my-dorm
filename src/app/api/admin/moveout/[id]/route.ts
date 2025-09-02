import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getRoleFromCookie } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const role = await getRoleFromCookie();
  if (role !== "admin") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const request = await db.moveOutRequest.findUnique({
      where: { id: params.id },
      include: {
        room: true,
        user: {
          include: {
            bills: {
              where: { status: "UNPAID" },
            },
          },
        },
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    //  ถ้าอนุมัติ → ปล่อยห้องว่าง + ตัดการเชื่อมกับผู้เช่า + อัปเดตสถานะผู้ใช้
    if (status === "APPROVED") {
      await db.room.update({
        where: { id: request.room.id },
        data: { status: "AVAILABLE", tenantId: null },
      });

      await db.profile.update({
        where: { userId: request.user.userId },
        data: { 
          roomId: null,
          isActive: false,         // ผู้เช่าไม่ active แล้ว
          moveOutDate: new Date(), // เก็บวันที่ย้ายออกล่าสุด
        },
      });
    }

    //  แจ้งเตือนผู้ใช้
    let message = "";
    if (status === "APPROVED") {
      message = "📢 คำร้องย้ายออกของคุณได้รับการอนุมัติ ✅";
    } else if (status === "REJECTED") {
      message = "📢 คำร้องย้ายออกของคุณถูกปฏิเสธ ❌";
    }

    await db.notification.create({
      data: {
        userId: request.user.id,
        message,
        type: "MOVEOUT",
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update moveout error:", error);
    return new NextResponse("Failed to update moveout status", { status: 500 });
  }
}
