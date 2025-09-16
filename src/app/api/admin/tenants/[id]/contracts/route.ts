import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { z } from "zod";
import { getRoleFromCookie } from "@/lib/auth";

// Helpers
const oneDayMs = 24 * 60 * 60 * 1000;
const addOneDay = (d: Date) => new Date(d.getTime() + oneDayMs);

const CreateSchema = z.object({
  // สำหรับสัญญาใหม่ (เช่าต่อ)
  startDate: z.string().refine((v) => !isNaN(Date.parse(v)), "วันเริ่มสัญญาไม่ถูกต้อง"),
  endDate: z.string().refine((v) => !isNaN(Date.parse(v)), "วันสิ้นสุดสัญญาไม่ถูกต้อง"),
  rentPerMonth: z.number().positive("ค่าเช่าต้องมากกว่า 0"),
  contractDate: z.string().optional(), // วันที่ทำสัญญาจริง (ถ้าไม่ส่งจะใช้วันนี้)
  dormOwnerName: z.string().min(1, "กรุณาระบุชื่อผู้ให้เช่า"),
  dormAddress: z.string().min(1, "กรุณาระบุที่อยู่หอ"),
  contractImages: z.array(z.string().url("URL รูปไม่ถูกต้อง")).max(10).default([]),
});

const PatchSchema = z.object({
  contractId: z.string().uuid("contractId ไม่ถูกต้อง"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  rentPerMonth: z.number().positive().optional(),
  contractDate: z.string().optional(),
  dormOwnerName: z.string().optional(),
  dormAddress: z.string().optional(),
  contractImages: z.array(z.string().url()).max(10).optional(),
});

// GET /api/admin/tenants/[id]/contracts
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const role = await getRoleFromCookie();
    if (role !== "admin") return new NextResponse("Unauthorized", { status: 401 });

    const tenantId = params.id;
    const contracts = await db.contract.findMany({
      where: { profileId: tenantId },
      orderBy: { startDate: "desc" },
    });

    return NextResponse.json({ success: true, contracts });
  } catch (err) {
    console.error("GET contracts error:", err);
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดภายในระบบ" }, { status: 500 });
  }
}

// POST /api/admin/tenants/[id]/contracts  (ต่อสัญญา)
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const role = await getRoleFromCookie();
    if (role !== "admin") return new NextResponse("Unauthorized", { status: 401 });

    const tenantId = params.id;
    const body = await req.json();
    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง";
      return NextResponse.json({ success: false, error: msg }, { status: 400 });
    }
    const { startDate, endDate, rentPerMonth, contractDate, dormOwnerName, dormAddress, contractImages } = parsed.data;

    // ผู้เช่ากับห้อง
    const tenant = await db.profile.findUnique({
      where: { id: tenantId },
      select: { id: true, roomId: true, address: true, nationalId: true },
    });
    if (!tenant) return NextResponse.json({ success: false, error: "ไม่พบผู้เช่า" }, { status: 404 });
    if (!tenant.roomId) {
      return NextResponse.json({ success: false, error: "ผู้เช่ายังไม่ได้ถือห้อง จึงไม่สามารถเพิ่มสัญญาได้" }, { status: 400 });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const cDate = contractDate ? new Date(contractDate) : new Date();
    if (end <= start) {
      return NextResponse.json({ success: false, error: "วันสิ้นสุดสัญญาต้องอยู่หลังวันเริ่มสัญญา" }, { status: 400 });
    }

    // ต้อง "เช่าต่อ" เมื่อสัญญาก่อนหน้าจบแล้วเท่านั้น
    const last = await db.contract.findFirst({
      where: { profileId: tenantId, roomId: tenant.roomId },
      orderBy: { endDate: "desc" },
    });
    if (last) {
      const earliest = addOneDay(last.endDate);
      if (start < earliest) {
        return NextResponse.json(
          { success: false, error: "สร้างสัญญาใหม่ได้เมื่อสัญญาเดิมครบกำหนดแล้วเท่านั้น (ห้ามทับช่วงเวลา)" },
          { status: 400 }
        );
      }
    }

    // ตรวจทับซ้อนกับสัญญาอื่น (ระดับห้อง)
    const overlap = await db.contract.findFirst({
      where: {
        roomId: tenant.roomId,
        startDate: { lte: end },
        endDate: { gte: start },
      },
      select: { id: true },
    });
    if (overlap) {
      return NextResponse.json({ success: false, error: "ช่วงวันที่สัญญาทับซ้อนกับสัญญาเดิมของห้องนี้" }, { status: 400 });
    }

    // สร้างสัญญาใหม่ (เก็บสัญญาเก่าไว้เป็นประวัติ)
    const created = await db.contract.create({
      data: {
        profileId: tenantId,
        roomId: tenant.roomId,
        dormOwnerName,
        dormAddress,
        contractDate: cDate,
        startDate: start,
        endDate: end,
        rentPerMonth,
        tenantNationalId: tenant.nationalId,
        tenantAddress: tenant.address,
        contractImages,
      },
    });

    return NextResponse.json({ success: true, contract: created }, { status: 201 });
  } catch (err) {
    console.error("POST contracts error:", err);
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดภายในระบบ" }, { status: 500 });
  }
}

// PATCH /api/admin/tenants/[id]/contracts  (แก้ไขสัญญาเฉพาะแอดมิน)
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const role = await getRoleFromCookie();
    if (role !== "admin") return new NextResponse("Unauthorized", { status: 401 });

    const tenantId = params.id;
    const body = await req.json();
    const parsed = PatchSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง";
      return NextResponse.json({ success: false, error: msg }, { status: 400 });
    }

    const { contractId, startDate, endDate, rentPerMonth, contractDate, dormOwnerName, dormAddress, contractImages } = parsed.data;

    const contract = await db.contract.findUnique({
      where: { id: contractId },
      select: { id: true, profileId: true, roomId: true, startDate: true, endDate: true },
    });
    if (!contract || contract.profileId !== tenantId) {
      return NextResponse.json({ success: false, error: "ไม่พบสัญญาที่ต้องการแก้ไข" }, { status: 404 });
    }

    // เตรียมค่าที่จะอัพเดต
    const newStart = startDate ? new Date(startDate) : contract.startDate;
    const newEnd = endDate ? new Date(endDate) : contract.endDate;
    if (newEnd <= newStart) {
      return NextResponse.json({ success: false, error: "วันสิ้นสุดสัญญาต้องอยู่หลังวันเริ่มสัญญา" }, { status: 400 });
    }

    // ห้ามทับซ้อนกับ “สัญญาอื่น” ในห้องเดียวกัน
    const overlap = await db.contract.findFirst({
      where: {
        roomId: contract.roomId,
        id: { not: contract.id },
        startDate: { lte: newEnd },
        endDate: { gte: newStart },
      },
      select: { id: true },
    });
    if (overlap) {
      return NextResponse.json({ success: false, error: "ช่วงวันที่สัญญาทับซ้อนกับสัญญาอื่นในห้องนี้" }, { status: 400 });
    }

    const updated = await db.contract.update({
      where: { id: contract.id },
      data: {
        ...(startDate ? { startDate: newStart } : {}),
        ...(endDate ? { endDate: newEnd } : {}),
        ...(typeof rentPerMonth === "number" ? { rentPerMonth } : {}),
        ...(contractDate ? { contractDate: new Date(contractDate) } : {}),
        ...(dormOwnerName ? { dormOwnerName } : {}),
        ...(dormAddress ? { dormAddress } : {}),
        ...(contractImages ? { contractImages } : {}),
      },
    });

    return NextResponse.json({ success: true, contract: updated });
  } catch (err) {
    console.error("PATCH contracts error:", err);
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดภายในระบบ" }, { status: 500 });
  }
}
