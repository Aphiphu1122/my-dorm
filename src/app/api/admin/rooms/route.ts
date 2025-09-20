// src/app/api/admin/rooms/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/prisma";
import { checkAdminAuthOrReject } from "@/lib/auth";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
const noStore = {
  "Cache-Control": "no-store, no-cache, must-revalidate, private",
} as const;

/** ---------- Query Schemas ---------- */
const QuerySchema = z.object({
  q: z.string().trim().optional(),
  status: z.enum(["AVAILABLE", "OCCUPIED", "MAINTENANCE"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

const CreateRoomSchema = z.object({
  roomNumber: z.string().trim().min(1, "กรอกเลขห้อง"),
});

/* =============================== GET =============================== */
export async function GET(req: NextRequest) {
  // 🔐 admin only
  const auth = await checkAdminAuthOrReject();
  if (auth instanceof NextResponse) {
    auth.headers.set("Cache-Control", noStore["Cache-Control"]);
    return auth;
  }

  try {
    const url = new URL(req.url);
    const parsed = QuerySchema.safeParse({
      q: url.searchParams.get("q") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
      page: url.searchParams.get("page") ?? undefined,
      pageSize: url.searchParams.get("pageSize") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400, headers: noStore }
      );
    }

    const { q, status, page, pageSize } = parsed.data;

    // ✅ base where (ค้นหา)
    const baseWhere = {
      ...(q
        ? {
            OR: [
              { roomNumber: { contains: q, mode: "insensitive" } },
              { tenant: { is: { firstName: { contains: q, mode: "insensitive" } } } },
              { tenant: { is: { lastName:  { contains: q, mode: "insensitive" } } } },
              { tenant: { is: { email:     { contains: q, mode: "insensitive" } } } },
            ],
          }
        : {}),
    } satisfies NonNullable<
      Parameters<typeof db.room.findMany>[0]
    >["where"];

    // ✅ เติมตัวกรองตามสถานะ (ทำที่ DB เท่าที่ทำได้)
    const statusWhere =
      status === "MAINTENANCE"
        ? { status: "MAINTENANCE" as const }
        : status === "OCCUPIED"
        ? { tenant: { isNot: null } as const, status: { not: "MAINTENANCE" as const } }
        : status === "AVAILABLE"
        ? { tenant: { is: null } as const, status: { not: "MAINTENANCE" as const } }
        : {};

    const where = { ...baseWhere, ...statusWhere } satisfies NonNullable<
      Parameters<typeof db.room.findMany>[0]
    >["where"];

    const [rows, total] = await Promise.all([
      db.room.findMany({
        where,
        orderBy: { roomNumber: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          tenant: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      }),
      db.room.count({ where }),
    ]);

    // 🧮 คำนวณสถานะจริงฝั่งแอป (กันข้อมูลไม่ sync)
    const computed = rows.map((room) => ({
      ...room,
      status:
        room.status === "MAINTENANCE"
          ? "MAINTENANCE"
          : room.tenant
          ? "OCCUPIED"
          : "AVAILABLE",
    }));

    // ป้องกัน edge case: ถ้า status ถูกส่งมา กรองอีกรอบตามสถานะที่คำนวณ
    const filtered = status ? computed.filter((r) => r.status === status) : computed;

    return NextResponse.json(
      {
        success: true,
        rooms: filtered,
        meta: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
      { status: 200, headers: noStore }
    );
  } catch (error) {
    console.error("❌ Failed to get rooms:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500, headers: noStore }
    );
  }
}

/* =============================== POST =============================== */
export async function POST(req: NextRequest) {
  // 🔐 admin only
  const auth = await checkAdminAuthOrReject();
  if (auth instanceof NextResponse) {
    auth.headers.set("Cache-Control", noStore["Cache-Control"]);
    return auth;
  }

  try {
    const json = await req.json();
    const parsed = CreateRoomSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400, headers: noStore }
      );
    }

    const roomNumber = parsed.data.roomNumber.trim();

    // กันเลขห้องซ้ำ (case-insensitive)
    const dup = await db.room.findFirst({
      where: { roomNumber: { equals: roomNumber, mode: "insensitive" } },
      select: { id: true },
    });
    if (dup) {
      return NextResponse.json(
        { error: "มีเลขห้องนี้อยู่แล้ว" },
        { status: 409, headers: noStore }
      );
    }

    const created = await db.room.create({
      data: { roomNumber },
      select: { id: true, roomNumber: true, status: true, createdAt: true },
    });

    return NextResponse.json(
      { success: true, room: created },
      { status: 201, headers: noStore }
    );
  } catch (error) {
    console.error("❌ Failed to create room:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500, headers: noStore }
    );
  }
}
