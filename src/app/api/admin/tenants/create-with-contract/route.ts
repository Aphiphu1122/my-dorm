import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getRoleFromCookie } from "@/lib/auth";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

// ✅ type สำหรับจับ Prisma P2002 โดยไม่ต้อง import type จาก client
interface PrismaKnownError {
  code?: string;
  meta?: {
    target?: string[];
  };
}

// --------- Zod Schema ---------
const PayloadSchema = z.object({
  // ข้อมูลผู้เช่า
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
    .optional(), // ไม่ส่งมาก็ได้ เดี๋ยวคำนวณ +1 ปีให้
  contractDate: z
    .string()
    .refine((v) => !isNaN(Date.parse(v)), "วันที่ทำสัญญาไม่ถูกต้อง")
    .optional(),

  // ข้อมูลหอ (เจ้าของ/ที่อยู่หอ)
  dormOwnerName: z.string().min(1, "กรุณาระบุชื่อผู้ให้เช่า"),
  dormAddress: z.string().min(1, "กรุณาระบุที่อยู่หอ"),

  // รูปสัญญา (Cloudinary URLs สูงสุด 3 รูป)
  contractImages: z.array(z.string().url("URL รูปไม่ถูกต้อง")).max(3).default([]),

  // login เริ่มต้น (ให้ผู้เช่าเปลี่ยนทีหลัง)
  tempPassword: z.string().min(6, "รหัสผ่านอย่างน้อย 6 ตัวอักษร"),

  // ตั้งค่า email อัตโนมัติจากเลขห้อง เช่น Dormmy001@dorm.com
  emailPrefix: z.string().default("Dormmy"),
  emailDomain: z.string().default("@dorm.com"),
});

// --------- Helpers ---------
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

// --------- POST: Admin create tenant + contract ----------
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

    // 3) ตรวจห้อง & สร้าง email อัตโนมัติจากเลขห้อง
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

    // กันเคสมีคนถือห้องอยู่แล้ว (ป้องกันชนกับ unique อีกชั้น)
    const holder = await db.profile.findFirst({ where: { roomId } });
    if (holder) {
      return NextResponse.json({ success: false, error: "มีผู้เช่าห้องนี้อยู่แล้ว" }, { status: 400 });
    }

    // email เช่น Dormmy001@dorm.com (toLowerCase)
    const email = sanitizeEmail(emailPrefix, room.roomNumber, emailDomain);

    // ตรวจซ้ำข้อมูลสำคัญ
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

    // 4) เตรียมคำนวณวัน
    const start = new Date(startDate);
    const endDt = endDate ? new Date(endDate) : addOneYear(start);
    const cDate = contractDate ? new Date(contractDate) : new Date();

    // 5) แฮชรหัสผ่านชั่วคราว
    const hashed = await bcrypt.hash(tempPassword, 10);

    // 6) ทำงานแบบ atomic
    const result = await db.$transaction(async (tx) => {
      // (1) สร้าง profile
      const user = await tx.profile.create({
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
          roomStartDate: start,
          isActive: true,
        },
        select: { id: true, firstName: true, lastName: true, email: true },
      });

      // (2) สร้าง contract
      await tx.contract.create({
        data: {
          profileId: user.id,
          roomId,
          dormOwnerName,
          dormAddress,
          contractDate: cDate,
          startDate: start,
          endDate: endDt,
          rentPerMonth,
          tenantNationalId: nationalId,
          tenantAddress: address,
          contractImages,
        },
      });

      // (3) อัปเดตสถานะห้อง
      await tx.room.update({
        where: { id: roomId },
        data: { status: "OCCUPIED", assignedAt: new Date() },
      });

      return user;
    });

    return NextResponse.json(
      { success: true, message: "สร้างผู้เช่าพร้อมสัญญาแล้ว", user: result, email },
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
