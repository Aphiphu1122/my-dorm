// src/app/api/admin/users/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/prisma";

export async function GET() {
  try {
    // ตรวจสิทธิ์แอดมิน
    const cookieStore = await cookies();
    const role = cookieStore.get("role")?.value;
    if (role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // === ผู้เช่าที่ยังพักอยู่ (มีห้องปัจจุบัน) ===
    const activeProfiles = await db.profile.findMany({
      where: {
        role: "user",
        roomId: { not: null },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        birthday: true,
        address: true,
        nationalId: true,
        userId: true,
        createdAt: true,
        roomStartDate: true,
        isActive: true,
        moveOutDate: true,
        room: {
          select: {
            roomNumber: true,
            assignedAt: true,
          },
        },
      },
      orderBy: [{ room: { roomNumber: "asc" } }],
    });

    const activeTenants = activeProfiles.map((p) => ({
      id: p.id,
      firstName: p.firstName,
      lastName: p.lastName,
      email: p.email,
      phone: p.phone,
      birthday: p.birthday,
      address: p.address,
      nationalId: p.nationalId,
      userId: p.userId,
      createdAt: p.createdAt,
      roomStartDate: p.roomStartDate,
      roomNumber: p.room?.roomNumber ?? null,
      assignedAt: p.room?.assignedAt ?? null,
      status: "ACTIVE" as const,
      moveOutDate: p.moveOutDate ?? null,
    }));

    // === ผู้เช่าที่ย้ายออกแล้ว ===
    const movedOutProfiles = await db.profile.findMany({
      where: {
        role: "user",
        roomId: null,
        OR: [{ isActive: false }, { moveOutDate: { not: null } }],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        birthday: true,
        address: true,
        nationalId: true,
        userId: true,
        createdAt: true,
        roomStartDate: true,
        isActive: true,
        moveOutDate: true,
      },
      orderBy: [{ moveOutDate: "desc" }, { updatedAt: "desc" }],
    });

    const movedOutTenants = movedOutProfiles.map((p) => ({
      id: p.id,
      firstName: p.firstName,
      lastName: p.lastName,
      email: p.email,
      phone: p.phone,
      birthday: p.birthday,
      address: p.address,
      nationalId: p.nationalId,
      userId: p.userId,
      createdAt: p.createdAt,
      roomStartDate: p.roomStartDate,
      roomNumber: null as string | null,
      assignedAt: null as Date | null,
      status: "MOVED_OUT" as const,
      moveOutDate: p.moveOutDate ?? null,
    }));

    return NextResponse.json(
      {
        users: [...activeTenants, ...movedOutTenants], // ✅ เผื่อหน้าเก่ายังใช้ data.users
        activeTenants,
        movedOutTenants,
        totals: {
          active: activeTenants.length,
          movedOut: movedOutTenants.length,
          all: activeTenants.length + movedOutTenants.length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error fetching tenants:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
