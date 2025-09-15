import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getRoleFromCookie } from "@/lib/auth";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

/** Lightweight Prisma error type */
interface PrismaKnownError {
  code?: string;
  meta?: { target?: string[] };
}

/* ---------------- Zod Schema ---------------- */
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
  rentPerMonth: z.number().positive("ค่าเช่าต้องมากกว่า 0"),
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
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 2) validate payload
    const body = await req.json();
    const parsed = PayloadSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง";
      return NextResponse.json({ success: false, error: msg }, { status: 400 });
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
      return NextResponse.json({ success: false, error: "ไม่พบห้องที่เลือก" }, { status: 404 });
    }
    if (room.status !== "AVAILABLE") {
      return NextResponse.json({ success: false, error: "ห้องนี้ไม่ว่าง" }, { status: 400 });
    }

    // กันเคสมีผู้เช่าเซ็ตอยู่แล้ว (ความปลอดภัยอีกชั้น)
    const holder = await db.profile.findFirst({ where: { roomId } });
    if (holder) {
      return NextResponse.json({ success: false, error: "มีผู้เช่าห้องนี้อยู่แล้ว" }, { status: 400 });
    }

    // 4) วันสัญญา/วันเริ่ม-สิ้นสุด
    const start = new Date(startDate);
    const endDt = endDate ? new Date(endDate) : addOneYear(start);
    const cDate = contractDate ? new Date(contractDate) : new Date();

    if (endDt <= start) {
      return NextResponse.json(
        { success: false, error: "วันสิ้นสุดสัญญาต้องอยู่หลังวันเริ่มสัญญา" },
        { status: 400 }
      );
    }

    // 5) ตรวจวันทับซ้อนกับสัญญาห้องเดิม (สำคัญ)
    // เงื่อนไขทับซ้อน: existing.start <= newEnd AND existing.end >= newStart
    const overlap = await db.contract.findFirst({
      where: {
        roomId,
        startDate: { lte: endDt },
        endDate: { gte: start },
      },
      select: { id: true, startDate: true, endDate: true },
    });
    if (overlap) {
      return NextResponse.json(
        { success: false, error: "ช่วงวันที่สัญญาทับซ้อนกับสัญญาเดิมของห้องนี้" },
        { status: 400 }
      );
    }

    // 6) อีเมลจากเลขห้อง + กันข้อมูลซ้ำ (email/nationalId)
    const email = sanitizeEmail(emailPrefix, room.roomNumber, emailDomain);
    const dup = await db.profile.findFirst({
      where: { OR: [{ email }, { nationalId }] },
      select: { id: true },
    });
    if (dup) {
      return NextResponse.json(
        { success: false, error: "ข้อมูลซ้ำ (email หรือ เลขบัตรประชาชน)" },
        { status: 409 }
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
          contractDate: cDate,      // วันที่ทำสัญญาจริง
          startDate: start,         // วันที่เริ่มสัญญา/เข้าพัก
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
      { status: 201 }
    );
  } catch (err: unknown) {
    const e = err as PrismaKnownError;
    if (e.code === "P2002") {
      const fields = e.meta?.target?.join(", ") ?? "field";
      return NextResponse.json(
        { success: false, error: `ข้อมูลซ้ำใน ${fields}` },
        { status: 409 }
      );
    }
    console.error("create-with-contract error:", err);
    return NextResponse.json(
      { success: false, error: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 }
    );
  }
}
