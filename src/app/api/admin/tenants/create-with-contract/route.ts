// src/app/api/admin/tenants/create-with-contract/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getRoleFromCookie } from "@/lib/auth";
import { randomUUID } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const noStore = {
  "Cache-Control": "no-store, no-cache, must-revalidate, private",
} as const;

/** Lightweight Prisma error type */
interface PrismaKnownError {
  code?: string;
  meta?: { target?: string[] };
}

/* ---------------- Zod Schema ----------------
 * ใช้ z.coerce.number() เพื่อรองรับค่าที่มาจากฟอร์ม (string → number)
 */
const PayloadSchema = z.object({
  // ผู้เช่า
  firstName: z.string().min(1, "กรุณาระบุชื่อ"),
  lastName: z.string().min(1, "กรุณาระบุนามสกุล"),
  phone: z.string().min(9, "เบอร์โทรไม่ถูกต้อง"),
  birthday: z.string().refine((v) => !isNaN(Date.parse(v)), "วันเกิดไม่ถูกต้อง"),
  address: z.string().min(1, "กรุณาระบุที่อยู่"),
  nationalId: z.string().length(13, "เลขบัตรประชาชนต้องมี 13 หลัก"),

  // ห้อง/สัญญา
  roomId: z.string().uuid("roomId ไม่ถูกต้อง"),
  rentPerMonth: z.coerce.number().positive("ค่าเช่าต้องมากกว่า 0"),
  startDate: z.string().refine((v) => !isNaN(Date.parse(v)), "วันเริ่มเช่าไม่ถูกต้อง"),
  endDate: z
    .string()
    .refine((v) => !isNaN(Date.parse(v)), "วันสิ้นสุดสัญญาไม่ถูกต้อง")
    .optional(), // ไม่ส่งมาก็จะ +1 ปีอัตโนมัติ
  contractDate: z
    .string()
    .refine((v) => !isNaN(Date.parse(v)), "วันที่ทำสัญญาไม่ถูกต้อง")
    .optional(),

  // ข้อมูลหอ
  dormOwnerName: z.string().min(1, "กรุณาระบุชื่อผู้ให้เช่า"),
  dormAddress: z.string().min(1, "กรุณาระบุที่อยู่หอ"),

  // รูปสัญญา (สูงสุด 10)
  contractImages: z.array(z.string().url("URL รูปไม่ถูกต้อง")).max(10).default([]),

  // login เริ่มต้น
  tempPassword: z.string().min(6, "รหัสผ่านอย่างน้อย 6 ตัวอักษร"),

  // อีเมลอัตโนมัติจากเลขห้อง เช่น Dormmy001@dorm.com
  emailPrefix: z.string().default("Dormmy"),
  emailDomain: z.string().default("@dorm.com"),
});

/* ---------------- Helpers ---------------- */
// ปกติ <input type="date"> จะได้สตริง YYYY-MM-DD (ไม่มีเวลา/โซน)
// เพื่อให้เทียบช่วงได้เสถียร เราตรึงเป็นต้นวัน/ท้ายวันตาม UTC
const asStartOfDayUTC = (d: string) => new Date(`${d}T00:00:00.000Z`);
const asEndOfDayUTC = (d: string) => new Date(`${d}T23:59:59.999Z`);

function addOneYear(d: Date) {
  const nd = new Date(d);
  nd.setFullYear(nd.getFullYear() + 1);
  return nd;
}

function sanitizeEmail(prefix: string, roomNumber: string, domain: string) {
  const p = (prefix || "Dormmy").trim();
  const d = (domain || "@dorm.com").trim().toLowerCase();
  const withAt = d.startsWith("@") ? d : `@${d}`;
  return `${p}${roomNumber}${withAt}`.toLowerCase();
}

/* -------------- POST: create tenant + contract -------------- */
export async function POST(req: Request) {
  try {
    // 1) ต้องเป็น admin
    const role = await getRoleFromCookie();
    if (role !== "admin") {
      return new NextResponse("Unauthorized", { status: 401, headers: noStore });
    }

    // 2) validate payload
    const body = await req.json();
    const parsed = PayloadSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง";
      return NextResponse.json({ success: false, error: msg }, { status: 400, headers: noStore });
    }

    const {
      firstName,
      lastName,
      phone,
      birthday,
      address,
      nationalId,
      roomId,
      rentPerMonth,
      startDate,
      endDate,
      contractDate,
      dormOwnerName,
      dormAddress,
      contractImages,
      tempPassword,
      emailPrefix,
      emailDomain,
    } = parsed.data;

    // 3) ตรวจห้อง
    const room = await db.room.findUnique({
      where: { id: roomId },
      select: { id: true, roomNumber: true, status: true },
    });
    if (!room) {
      return NextResponse.json({ success: false, error: "ไม่พบห้องที่เลือก" }, { status: 404, headers: noStore });
    }
    if (room.status !== "AVAILABLE") {
      return NextResponse.json({ success: false, error: "ห้องนี้ไม่ว่าง" }, { status: 400, headers: noStore });
    }

    // กันเคสมีผู้เช่าเซ็ตอยู่แล้ว (ความปลอดภัยอีกชั้น)
    const holder = await db.profile.findFirst({ where: { roomId } });
    if (holder) {
      return NextResponse.json({ success: false, error: "มีผู้เช่าห้องนี้อยู่แล้ว" }, { status: 400, headers: noStore });
    }

    // 4) วันสัญญา/วันเริ่ม-สิ้นสุด (normalize ให้คงที่)
    const start = asStartOfDayUTC(startDate);
    const endDateStr = endDate ?? addOneYear(start).toISOString().slice(0, 10);
    const endDt = asEndOfDayUTC(endDateStr);
    const cDate = contractDate ? asStartOfDayUTC(contractDate) : new Date();

    if (endDt <= start) {
      return NextResponse.json(
        { success: false, error: "วันสิ้นสุดสัญญาต้องอยู่หลังวันเริ่มสัญญา" },
        { status: 400, headers: noStore }
      );
    }

    // 5) ตรวจวันทับซ้อนกับสัญญาของ "ห้องเดียวกัน"
    // ใช้ exclusive-end: overlap ถ้า (existing.start < newEnd) && (existing.end > newStart)
    const overlap = await db.contract.findFirst({
      where: {
        roomId,
        startDate: { lt: endDt },
        endDate: { gt: start },
      },
      select: { id: true },
    });
    if (overlap) {
      return NextResponse.json(
        { success: false, error: "ช่วงวันที่สัญญาทับซ้อนกับสัญญาเดิมของห้องนี้" },
        { status: 400, headers: noStore }
      );
    }

    // 6) อีเมลจากเลขห้อง + กันข้อมูลซ้ำ (email / nationalId)
    const email = sanitizeEmail(emailPrefix, room.roomNumber, emailDomain);
    const dup = await db.profile.findFirst({
      where: {
        OR: [
          { email: { equals: email, mode: "insensitive" } },
          { nationalId },
        ],
      },
      select: { id: true },
    });
    if (dup) {
      return NextResponse.json(
        { success: false, error: "ข้อมูลซ้ำ (email หรือ เลขบัตรประชาชน)" },
        { status: 409, headers: noStore }
      );
    }

    // 7) แฮชรหัสผ่านเริ่มต้น
    const hashed = await bcrypt.hash(tempPassword, 10);

    // 8) ทำธุรกรรม
    const user = await db.$transaction(async (tx) => {
      // (1) profile
      const created = await tx.profile.create({
        data: {
          userId: randomUUID(),
          email,
          password: hashed,
          firstName,
          lastName,
          phone,
          birthday: new Date(birthday),
          address,
          nationalId,
          role: "user",
          roomId,
          roomStartDate: start, // วันที่เข้าพัก
          isActive: true,
        },
        select: { id: true, firstName: true, lastName: true, email: true },
      });

      // (2) contract
      await tx.contract.create({
        data: {
          profileId: created.id,
          roomId,
          dormOwnerName,
          dormAddress,
          contractDate: cDate, // วันที่ทำสัญญาจริง
          startDate: start, // วันที่เริ่มสัญญา/เข้าพัก
          endDate: endDt,
          rentPerMonth,
          tenantNationalId: nationalId,
          tenantAddress: address,
          contractImages,
        },
      });

      // (3) อัพเดตสถานะห้อง
      await tx.room.update({
        where: { id: roomId },
        data: { status: "OCCUPIED", assignedAt: new Date() },
      });

      return created;
    });

    return NextResponse.json(
      { success: true, message: "สร้างผู้เช่าพร้อมสัญญาแล้ว", user, email },
      { status: 201, headers: noStore }
    );
  } catch (err: unknown) {
    const e = err as PrismaKnownError;
    if (e?.code === "P2002") {
      const fields = e.meta?.target?.join(", ") ?? "field";
      return NextResponse.json(
        { success: false, error: `ข้อมูลซ้ำใน ${fields}` },
        { status: 409, headers: noStore }
      );
    }
    console.error("create-with-contract error:", err);
    return NextResponse.json(
      { success: false, error: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500, headers: noStore }
    );
  }
}
