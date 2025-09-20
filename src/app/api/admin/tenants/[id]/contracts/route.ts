// src/app/api/admin/tenants/[id]/contracts/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/prisma";
import { z } from "zod";
import { checkAdminAuthOrReject, getRoleFromCookie } from "@/lib/auth";

/** route นี้อาศัยคุกกี้ → ปิดแคชทั้งหมด */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
const noStore = {
  "Cache-Control": "no-store, no-cache, must-revalidate, private",
} as const;

const ok = (data: unknown, status = 200) =>
  NextResponse.json({ success: true, ...(data as object) }, { status, headers: noStore });
const err = (message: string, status: number) =>
  NextResponse.json({ success: false, error: message }, { status, headers: noStore });

/* ----------------------------- Helpers ----------------------------- */
const oneDayMs = 24 * 60 * 60 * 1000;
const addOneDay = (d: Date) => new Date(d.getTime() + oneDayMs);

/* ----------------------------- Schemas ----------------------------- */
const ParamsSchema = z.object({ id: z.string().min(1) });

// ใช้ .coerce เพื่อรองรับกรณีที่ FE ส่งค่ามาเป็น string
const CreateSchema = z.object({
  startDate: z.string().datetime("วันเริ่มสัญญาไม่ถูกต้อง"),
  endDate: z.string().datetime("วันสิ้นสุดสัญญาไม่ถูกต้อง"),
  rentPerMonth: z.coerce.number().positive("ค่าเช่าต้องมากกว่า 0"),
  contractDate: z.string().datetime().optional(), // ถ้าไม่ส่งจะใช้วันนี้
  dormOwnerName: z.string().min(1, "กรุณาระบุชื่อผู้ให้เช่า"),
  dormAddress: z.string().min(1, "กรุณาระบุที่อยู่หอ"),
  contractImages: z.array(z.string().url("URL รูปไม่ถูกต้อง")).max(10).optional().default([]),
});

const PatchSchema = z.object({
  contractId: z.string().uuid("contractId ไม่ถูกต้อง"),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  rentPerMonth: z.coerce.number().positive().optional(),
  contractDate: z.string().datetime().optional(),
  dormOwnerName: z.string().optional(),
  dormAddress: z.string().optional(),
  contractImages: z.array(z.string().url()).max(10).optional(),
}).superRefine((o, ctx) => {
  const hasUpdate =
    o.startDate !== undefined ||
    o.endDate !== undefined ||
    o.rentPerMonth !== undefined ||
    o.contractDate !== undefined ||
    o.dormOwnerName !== undefined ||
    o.dormAddress !== undefined ||
    o.contractImages !== undefined;

  if (!hasUpdate) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "ไม่มีข้อมูลสำหรับแก้ไข" });
  }
});

/* ================================ GET ================================ */
// GET /api/admin/tenants/[id]/contracts
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await checkAdminAuthOrReject();
  if (auth instanceof NextResponse) return auth;

  try {
    const { id: tenantId } = ParamsSchema.parse(params);

    const contracts = await db.contract.findMany({
      where: { profileId: tenantId },
      orderBy: { startDate: "desc" },
    });

    // normalize รูปภาพให้เป็น array เสมอ
    const normalized = contracts.map((c) => ({
      ...c,
      contractImages: Array.isArray(c.contractImages) ? c.contractImages : [],
    }));

    return ok({ contracts: normalized });
  } catch (e) {
    console.error("GET contracts error:", e);
    return err("เกิดข้อผิดพลาดภายในระบบ", 500);
  }
}

/* ================================ POST =============================== */
// POST /api/admin/tenants/[id]/contracts  (ต่อสัญญา)
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const role = await getRoleFromCookie();
  if (role !== "admin") return err("Unauthorized", 401);

  try {
    const { id: tenantId } = ParamsSchema.parse(params);

    const body = await req.json();
    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง";
      return err(msg, 400);
    }

    const {
      startDate,
      endDate,
      rentPerMonth,
      contractDate,
      dormOwnerName,
      dormAddress,
      contractImages,
    } = parsed.data;

    // ผู้เช่ากับห้อง
    const tenant = await db.profile.findUnique({
      where: { id: tenantId },
      select: { id: true, roomId: true, address: true, nationalId: true },
    });
    if (!tenant) return err("ไม่พบผู้เช่า", 404);
    if (!tenant.roomId) return err("ผู้เช่ายังไม่ได้ถือห้อง จึงไม่สามารถเพิ่มสัญญาได้", 400);

    const start = new Date(startDate);
    const end = new Date(endDate);
    const cDate = contractDate ? new Date(contractDate) : new Date();
    if (end <= start) return err("วันสิ้นสุดสัญญาต้องอยู่หลังวันเริ่มสัญญา", 400);

    // ต้อง “เช่าต่อ” เมื่อสัญญาก่อนหน้าจบแล้วเท่านั้น
    const last = await db.contract.findFirst({
      where: { profileId: tenantId, roomId: tenant.roomId },
      orderBy: { endDate: "desc" },
    });
    if (last) {
      const earliest = addOneDay(new Date(last.endDate));
      if (start < earliest) {
        return err(
          "สร้างสัญญาใหม่ได้เมื่อสัญญาเดิมครบกำหนดแล้วเท่านั้น (ห้ามทับช่วงเวลา)",
          400
        );
      }
    }

    // กันทับซ้อนสัญญาอื่นในระดับห้อง
    const overlap = await db.contract.findFirst({
      where: {
        roomId: tenant.roomId,
        startDate: { lte: end },
        endDate: { gte: start },
      },
      select: { id: true },
    });
    if (overlap) return err("ช่วงวันที่สัญญาทับซ้อนกับสัญญาเดิมของห้องนี้", 400);

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
        contractImages: contractImages ?? [],
      },
    });

    return ok({ contract: { ...created, contractImages: contractImages ?? [] } }, 201);
  } catch (e) {
    console.error("POST contracts error:", e);
    return err("เกิดข้อผิดพลาดภายในระบบ", 500);
  }
}

/* =============================== PATCH =============================== */
// PATCH /api/admin/tenants/[id]/contracts  (แก้ไขสัญญาเฉพาะแอดมิน)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const role = await getRoleFromCookie();
  if (role !== "admin") return err("Unauthorized", 401);

  try {
    const { id: tenantId } = ParamsSchema.parse(params);

    const body = await req.json();
    const parsed = PatchSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง";
      return err(msg, 400);
    }

    const {
      contractId,
      startDate,
      endDate,
      rentPerMonth,
      contractDate,
      dormOwnerName,
      dormAddress,
      contractImages,
    } = parsed.data;

    const contract = await db.contract.findUnique({
      where: { id: contractId },
      select: { id: true, profileId: true, roomId: true, startDate: true, endDate: true },
    });
    if (!contract || contract.profileId !== tenantId) {
      return err("ไม่พบสัญญาที่ต้องการแก้ไข", 404);
    }

    const newStart = startDate ? new Date(startDate) : new Date(contract.startDate);
    const newEnd = endDate ? new Date(endDate) : new Date(contract.endDate);
    if (newEnd <= newStart) return err("วันสิ้นสุดสัญญาต้องอยู่หลังวันเริ่มสัญญา", 400);

    // ห้ามทับซ้อนกับสัญญาอื่นในห้องเดียวกัน (ยกเว้นตัวเอง)
    const overlap = await db.contract.findFirst({
      where: {
        roomId: contract.roomId,
        id: { not: contract.id },
        startDate: { lte: newEnd },
        endDate: { gte: newStart },
      },
      select: { id: true },
    });
    if (overlap) return err("ช่วงวันที่สัญญาทับซ้อนกับสัญญาอื่นในห้องนี้", 400);

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

    return ok({
      contract: {
        ...updated,
        contractImages: Array.isArray(updated.contractImages) ? updated.contractImages : [],
      },
    });
  } catch (e) {
    console.error("PATCH contracts error:", e);
    return err("เกิดข้อผิดพลาดภายในระบบ", 500);
  }
}
