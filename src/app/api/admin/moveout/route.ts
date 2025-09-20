// src/app/api/admin/moveout/route.ts
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

/** Query params */
const QuerySchema = z.object({
  status: z.enum(["PENDING_APPROVAL", "APPROVED", "REJECTED"]).optional(),
  q: z
    .string()
    .trim()
    .transform((v) => (v === "" ? undefined : v))
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  from: z.string().datetime().optional(), // ISO
  to: z.string().datetime().optional(),   // ISO
});

export async function GET(req: NextRequest) {
  // 🔐 เช็กสิทธิ์แอดมิน
  const auth = await checkAdminAuthOrReject();
  if (auth instanceof NextResponse) {
    auth.headers.set("Cache-Control", noStore["Cache-Control"]);
    return auth;
  }

  try {
    // 🧭 อ่าน query
    const url = new URL(req.url);
    const parsed = QuerySchema.safeParse({
      status: url.searchParams.get("status") ?? undefined,
      q: url.searchParams.get("q") ?? undefined,
      page: url.searchParams.get("page") ?? undefined,
      pageSize: url.searchParams.get("pageSize") ?? undefined,
      from: url.searchParams.get("from") ?? undefined,
      to: url.searchParams.get("to") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400, headers: noStore }
      );
    }

    const { status, q, page, pageSize, from, to } = parsed.data;

    // ✅ สร้าง where ให้ TS ตรวจชนิดจาก Prisma client โดยตรง
    const where = {
      ...(status ? { status } : {}),
      ...((from || to)
        ? {
            createdAt: {
              gte: from ? new Date(from) : undefined,
              lte: to ? new Date(to) : undefined,
            },
          }
        : {}),
      ...(q
        ? {
            OR: [
              { room: { is: { roomNumber: { contains: q, mode: "insensitive" } } } },
              { user: { is: { firstName: { contains: q, mode: "insensitive" } } } },
              { user: { is: { lastName:  { contains: q, mode: "insensitive" } } } },
              { user: { is: { email:     { contains: q, mode: "insensitive" } } } },
            ],
          }
        : {}),
    } satisfies NonNullable<
      Parameters<typeof db.moveOutRequest.findMany>[0]
    >["where"];

    // 📊 นับทั้งหมดเพื่อทำ pagination
    const total = await db.moveOutRequest.count({ where });

    // 📥 ดึงรายการ (ล่าสุดก่อน)
    const rows = await db.moveOutRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        status: true,
        reason: true,
        moveOutDate: true,
        createdAt: true,
        userId: true,
        roomId: true,
        room: { select: { id: true, roomNumber: true } },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            bills: {
              where: { status: "UNPAID" },
              select: { id: true, totalAmount: true },
            },
          },
        },
      },
    });

    // 🧮 map เป็น payload ที่เบา + มีสรุปบิลค้าง
    const data = rows.map((r) => {
      const unpaidCount = r.user.bills.length;
      const unpaidTotal = r.user.bills.reduce((s, b) => s + b.totalAmount, 0);
      return {
        id: r.id,
        status: r.status,
        reason: r.reason,
        moveOutDate: r.moveOutDate,
        createdAt: r.createdAt,
        room: { id: r.roomId, roomNumber: r.room?.roomNumber ?? "-" },
        user: {
          id: r.user.id,
          firstName: r.user.firstName,
          lastName: r.user.lastName,
          email: r.user.email,
          phone: r.user.phone,
        },
        unpaidBillsCount: unpaidCount,
        unpaidBillsTotal: unpaidTotal,
      };
    });

    return NextResponse.json(
      {
        success: true,
        data,
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
    console.error("GET /api/admin/moveout error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500, headers: noStore }
    );
  }
}
