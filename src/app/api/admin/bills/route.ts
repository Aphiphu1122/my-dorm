// src/app/api/admin/bills/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { z } from "zod";
import { checkAdminAuthOrReject } from "@/lib/auth";

// เส้นทางนี้ผูกกับคุกกี้ → กันแคชทั้งหมด
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
const noStore = {
  "Cache-Control": "no-store, no-cache, must-revalidate, private",
} as const;

/** ---------- Schema (ใช้ z.coerce รองรับค่าที่ส่งมาเป็น string) ---------- */
const billSchema = z.object({
  tenantId: z.string().uuid(),
  roomId: z.string().uuid(),
  billingMonth: z.coerce.date(), // รับ "2025-02-01" หรือ Date ก็ได้
  rentAmount: z.coerce.number().min(0),

  waterPrev: z.coerce.number().min(0),
  waterCurr: z.coerce.number().min(0),
  waterRate: z.coerce.number().min(0),

  electricPrev: z.coerce.number().min(0),
  electricCurr: z.coerce.number().min(0),
  electricRate: z.coerce.number().min(0),
});

/** ฟิลเตอร์แบบเดียวกับ moveout */
const QuerySchema = z.object({
  status: z.enum(["PAID", "UNPAID", "PENDING_APPROVAL"]).optional(),
  q: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  from: z.string().datetime().optional(), // ISO date string → กรองตาม billingMonth
  to: z.string().datetime().optional(),
});

/** ช่วยทำให้เป็นขอบเขตเดือนเดียวกัน (start inclusive, end exclusive) */
function monthRange(d: Date) {
  const start = new Date(d);
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  return { start, end };
}

/** =================== POST: สร้างบิลใหม่ =================== */
export async function POST(req: Request) {
  try {
    // ✅ ตรวจสิทธิ์แอดมิน
    const auth = await checkAdminAuthOrReject();
    if (auth instanceof NextResponse) {
      auth.headers.set("Cache-Control", noStore["Cache-Control"]);
      return auth;
    }

    const json = await req.json();
    const parsed = billSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400, headers: noStore }
      );
    }

    const {
      tenantId,
      roomId,
      billingMonth,
      rentAmount,
      waterPrev,
      waterCurr,
      waterRate,
      electricPrev,
      electricCurr,
      electricRate,
    } = parsed.data;

    // ✅ ตรวจ meter ใหม่ต้อง ≥ meter เก่า
    const waterUnit = waterCurr - waterPrev;
    const electricUnit = electricCurr - electricPrev;
    if (waterUnit < 0 || electricUnit < 0) {
      return NextResponse.json(
        { error: "ค่า meter ใหม่ต้องมากกว่าหรือเท่ากับค่าเก่า" },
        { status: 400, headers: noStore }
      );
    }

    // ✅ ป้องกันออกบิลซ้ำเดือนเดียวกัน (ผูก tenant + room)
    const { start, end } = monthRange(billingMonth);
    const dup = await db.bill.findFirst({
      where: {
        tenantId,
        roomId,
        billingMonth: { gte: start, lt: end },
      },
      select: { id: true },
    });
    if (dup) {
      return NextResponse.json(
        { error: "มีบิลของเดือนนี้อยู่แล้ว" },
        { status: 409, headers: noStore }
      );
    }

    // ✅ คำนวณยอดรวม
    const totalAmount =
      rentAmount + waterUnit * waterRate + electricUnit * electricRate;

    // ✅ สร้างบิล (เก็บเป็นวันแรกของเดือนเพื่อความสม่ำเสมอ)
    const bill = await db.bill.create({
      data: {
        tenantId,
        roomId,
        billingMonth: start,
        rentAmount,

        waterPrev,
        waterCurr,
        waterRate,
        waterUnit,

        electricPrev,
        electricCurr,
        electricRate,
        electricUnit,

        totalAmount,
        status: "UNPAID",
      },
      select: {
        id: true,
        tenantId: true,
        roomId: true,
        billingMonth: true,
        totalAmount: true,
        status: true,
      },
    });

    // ✅ แจ้งเตือนผู้เช่า
    await db.notification.create({
      data: {
        userId: tenantId,
        message: `📢 มีบิลใหม่ของเดือน ${start.toLocaleDateString("th-TH", {
          year: "numeric",
          month: "long",
        })}`,
        type: "BILL_CREATED",
      },
    });

    return NextResponse.json({ bill }, { status: 201, headers: noStore });
  } catch (error) {
    console.error("💥 Create bill error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500, headers: noStore }
    );
  }
}

/** =================== GET: ดึงรายการบิลทั้งหมด (admin, รองรับกรอง/ค้นหา) =================== */
export async function GET(req: NextRequest) {
  try {
    // ✅ ตรวจสิทธิ์แอดมิน
    const auth = await checkAdminAuthOrReject();
    if (auth instanceof NextResponse) {
      auth.headers.set("Cache-Control", noStore["Cache-Control"]);
      return auth;
    }

    // 🧭 parse query
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

    // 🧱 build where
    const where = {
      ...(status ? { status } : {}),
      ...(from || to
        ? {
            billingMonth: {
              gte: from ? new Date(from) : undefined,
              lte: to ? new Date(to) : undefined,
            },
          }
        : {}),
      ...(q
        ? {
            OR: [
              // ค้นหาห้อง
              { room: { is: { roomNumber: { contains: q } } } },
              // ค้นหาชื่อ-นามสกุล-อีเมลของผู้เช่า
              { tenant: { is: { firstName: { contains: q, mode: "insensitive" } } } },
              { tenant: { is: { lastName: { contains: q, mode: "insensitive" } } } },
              { tenant: { is: { email: { contains: q, mode: "insensitive" } } } },
            ],
          }
        : {}),
    } satisfies NonNullable<Parameters<typeof db.bill.findMany>[0]>["where"];

    // 📊 total for pagination
    const total = await db.bill.count({ where });

    // 📥 query rows
    const rows = await db.bill.findMany({
      where,
      orderBy: [{ billingMonth: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        billingMonth: true,
        totalAmount: true,
        status: true,
        paymentDate: true,
        paymentSlipUrl: true,
        room: { select: { roomNumber: true } },
        tenant: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    // ✅ รูปแบบข้อมูลตอบกลับให้เบาและพร้อมใช้
    const data = rows.map((b) => ({
      id: b.id,
      billingMonth: b.billingMonth,
      totalAmount: b.totalAmount,
      status: b.status,
      paymentDate: b.paymentDate,
      paymentSlipUrl: b.paymentSlipUrl ?? null,
      room: { roomNumber: b.room?.roomNumber ?? "-" },
      tenant: {
        firstName: b.tenant?.firstName ?? "",
        lastName: b.tenant?.lastName ?? "",
        email: b.tenant?.email ?? "",
      },
    }));

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
    console.error("💥 Fetch bills error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500, headers: noStore }
    );
  }
}
