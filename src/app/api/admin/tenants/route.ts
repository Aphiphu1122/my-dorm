// src/app/api/admin/tenants/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/prisma";
import { checkAdminAuthOrReject } from "@/lib/auth";
import { z } from "zod";

/** เส้นทางนี้อาศัยคุกกี้ → ปิดแคชทั้งหมด */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
const noStore = {
  "Cache-Control": "no-store, no-cache, must-revalidate, private",
} as const;

/** Query params: ค้นหา/กรอง/แบ่งหน้า */
const QuerySchema = z.object({
  q: z.string().trim().optional(),
  // กรองด้วยสถานะจริงของห้อง หรือกรณีไม่มีห้อง = MOVEOUT
  status: z.enum(["OCCUPIED", "AVAILABLE", "MAINTENANCE", "MOVEOUT"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export async function GET(req: NextRequest) {
  // 🔐 ตรวจสิทธิ์แอดมิน
  const auth = await checkAdminAuthOrReject();
  if (auth instanceof NextResponse) {
    auth.headers.set("Cache-Control", noStore["Cache-Control"]);
    return auth;
  }

  try {
    // 🧭 อ่าน query
    const url = new URL(req.url);
    const parsed = QuerySchema.safeParse({
      q: url.searchParams.get("q") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
      page: url.searchParams.get("page") ?? undefined,
      pageSize: url.searchParams.get("pageSize") ?? undefined,
    });
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten() },
        { status: 400, headers: noStore }
      );
    }

    const { q, status, page, pageSize } = parsed.data;

    // ✅ where แบบ type-safe โดยอิงจาก signature ของ Prisma client
    type FindManyArg = NonNullable<Parameters<typeof db.profile.findMany>[0]>;
    const where: NonNullable<FindManyArg["where"]> = {
      role: "user",
      ...(q
        ? {
            OR: [
              { firstName: { contains: q, mode: "insensitive" } },
              { lastName:  { contains: q, mode: "insensitive" } },
              { email:     { contains: q, mode: "insensitive" } },
              { room: { is: { roomNumber: { contains: q, mode: "insensitive" } } } },
            ],
          }
        : {}),
      ...(status
        ? status === "MOVEOUT"
          ? { roomId: null }
          : { room: { is: { status } } }
        : {}),
    };

    // 📊 นับทั้งหมดเพื่อทำ pagination
    const total = await db.profile.count({ where });

    // 📥 ดึงรายการ
    const rows = await db.profile.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        room: {
          select: { id: true, roomNumber: true, status: true, assignedAt: true },
        },
        // สัญญาล่าสุด
        contracts: {
          orderBy: { startDate: "desc" },
          take: 1,
          select: {
            id: true,
            startDate: true,
            endDate: true,
            rentPerMonth: true,
            contractDate: true,
            contractImages: true,
          },
        },
        // คำร้องย้ายออกที่ยังค้าง
        moveOutRequests: {
          where: { status: "PENDING_APPROVAL" },
          take: 1,
          select: { id: true },
        },
        // บิลค้างชำระ (ไว้ทำสรุป)
        bills: {
          where: { status: "UNPAID" },
          select: { id: true, totalAmount: true },
        },
      },
    });

    // 🧮 map payload ให้ FE ใช้งานสะดวก
    const users = rows.map((t) => {
      const latest = t.contracts?.[0] ?? null;
      const unpaidBillsCount = t.bills.length;
      const unpaidBillsTotal = t.bills.reduce((s, b) => s + b.totalAmount, 0);
      const derivedStatus = t.room ? t.room.status : ("MOVEOUT" as const);

      return {
        id: t.id,
        firstName: t.firstName,
        lastName: t.lastName,
        email: t.email,
        phone: t.phone,
        birthday: t.birthday,
        address: t.address,
        nationalId: t.nationalId,
        userId: t.userId,
        isActive: t.isActive,

        // ห้อง
        roomId: t.room?.id ?? null,
        roomNumber: t.room?.roomNumber ?? null,
        status: t.room?.status ?? null, // ค่าสถานะเดิมของห้อง
        derivedStatus,                  // ถ้าไม่มีห้อง -> "MOVEOUT"
        roomStartDate: t.roomStartDate ?? null,
        assignedAt: t.room?.assignedAt ?? null,

        // สัญญาล่าสุด
        contractId: latest?.id ?? null,
        contractStartDate: latest?.startDate ?? null,
        contractEndDate: latest?.endDate ?? null,
        contractDate: latest?.contractDate ?? null,
        rentPerMonth: latest?.rentPerMonth ?? null,
        contractImages: Array.isArray(latest?.contractImages)
          ? latest!.contractImages
          : [],

        // คำร้องย้ายออกที่ยังค้าง + สรุปบิลค้าง
        hasPendingMoveOut: t.moveOutRequests.length > 0,
        unpaidBillsCount,
        unpaidBillsTotal,
      };
    });

    return NextResponse.json(
      {
        success: true,
        users,
        meta: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
      { status: 200, headers: noStore }
    );
  } catch (err) {
    console.error("GET /api/admin/tenants error:", err);
    return NextResponse.json(
      { success: false, error: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500, headers: noStore }
    );
  }
}
