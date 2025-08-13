import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getRoleFromCookie } from "@/lib/auth";

// 📌 GET room by ID
export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const role = await getRoleFromCookie();
  if (role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const room = await db.room.findUnique({
    where: { id: params.id },
    include: {
      tenant: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
      maintenanceRequests: true,
    },
  });

  if (!room) {
    return NextResponse.json({ error: "ไม่พบห้อง" }, { status: 404 });
  }

  return NextResponse.json({
    room: {
      id: room.id,
      roomNumber: room.roomNumber,
      status: room.status,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
      maintenanceCount: room.maintenanceRequests.length,
      tenant: room.tenant,
    },
  });
}

// 📝 PATCH update room
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const role = await getRoleFromCookie();
  if (role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { roomNumber, status } = body;

    const updatedRoom = await db.room.update({
      where: { id: params.id },
      data: {
        ...(roomNumber && { roomNumber }),
        ...(status && { status }),
      },
    });

    return NextResponse.json({ room: updatedRoom });
  } catch (error) {
    console.error("❌ PATCH ROOM ERROR:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการอัปเดตห้อง" }, { status: 500 });
  }
}

// 🗑 DELETE room
export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const role = await getRoleFromCookie();
  if (role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const roomId = params.id;

    const room = await db.room.findUnique({
      where: { id: roomId },
      include: {
        tenant: true,
        maintenanceRequests: true,
        bills: true,
      },
    });

    if (!room) {
      return NextResponse.json({ error: "ไม่พบห้องที่ต้องการลบ" }, { status: 404 });
    }

    if (room.bills.length > 0 || room.maintenanceRequests.length > 0) {
      return NextResponse.json(
        { error: "ไม่สามารถลบห้องนี้ได้ เนื่องจากมีบิลหรือคำร้องแจ้งซ่อมอยู่ในระบบ" },
        { status: 400 }
      );
    }

    if (room.tenantId) {
      await db.profile.update({
        where: { id: room.tenantId },
        data: { roomId: null },
      });
    }

    await db.room.delete({
      where: { id: roomId },
    });

    return NextResponse.json({ message: "ลบห้องสำเร็จ" }, { status: 200 });
  } catch (error) {
    console.error("❌ DELETE ROOM ERROR:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการลบห้อง" },
      { status: 500 }
    );
  }
}
