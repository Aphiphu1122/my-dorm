import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getRoleFromCookie } from "@/lib/auth";

// 📌 GET room by ID
export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const role = await getRoleFromCookie();
  if (role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // ✅ หา tenant จาก profile.roomId = room.id
  const room = await db.room.findUnique({
    where: { id: params.id },
    include: {
      maintenanceRequests: true,
    },
  });

  if (!room) {
    return NextResponse.json({ error: "ไม่พบห้อง" }, { status: 404 });
  }

  // ✅ หา tenant แยกต่างหาก
  const tenant = await db.profile.findFirst({
    where: { roomId: room.id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      roomStartDate: true,
    },
  });

  return NextResponse.json({
    room: {
      id: room.id,
      roomNumber: room.roomNumber,
      status: room.status,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
      assignedAt: room.assignedAt,
      maintenanceCount: room.maintenanceRequests.length,
      tenant, // ✅ tenant ที่หาได้
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
    const { roomNumber, status, tenantId } = body;

    const dataToUpdate: Partial<Prisma.roomUncheckedUpdateInput> = {};

    if (roomNumber) dataToUpdate.roomNumber = roomNumber;
    if (status) dataToUpdate.status = status;

    // ✅ ถ้ามีการ assign tenant ใหม่
    if (tenantId) {
      // อัปเดต profile ให้ผูกกับห้องนี้
      await db.profile.update({
        where: { id: tenantId },
        data: { roomStartDate: new Date(), roomId: params.id },
      });

      // mark assignedAt ของห้อง
      dataToUpdate.assignedAt = new Date();
    }

    // ✅ อัปเดตห้อง (ไม่มี tenantId ให้ update แล้ว)
    const updatedRoom = await db.room.update({
      where: { id: params.id },
      data: dataToUpdate,
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

    // ✅ clear tenant: หา profile ที่ roomId = roomId แล้ว set null
    await db.profile.updateMany({
      where: { roomId },
      data: { roomId: null, roomStartDate: null },
    });

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
