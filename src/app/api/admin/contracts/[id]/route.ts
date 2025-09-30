// src/app/api/admin/contracts/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { checkAdminAuthOrReject } from "@/lib/auth";
import { z } from "zod";

/** เส้นทางอาศัยคุกกี้ → กันแคช */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
const noStore = {
  "Cache-Control": "no-store, no-cache, must-revalidate, private",
} as const;

/** ---------- Types ---------- */
type ContractUpdateData = Partial<{
  startDate: Date;
  endDate: Date;
  contractDate: Date;
  rentPerMonth: number;
  dormOwnerName: string;
  dormAddress: string;
  contractImages: string[];
}>;

interface PrismaKnownError {
  code?: string;
  meta?: { target?: string[] };
}

/** ---------- Zod ---------- */
const UpdateSchema = z
  .object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    contractDate: z.string().datetime().optional(),
    rentPerMonth: z.number().positive().finite().optional(),
    dormOwnerName: z.string().min(1).optional(),
    dormAddress: z.string().min(1).optional(),
    contractImages: z.array(z.string().url()).max(10).optional(),
  })
  .refine((o) => Object.keys(o).length > 0, { message: "ไม่มีข้อมูลสำหรับแก้ไข" });

/* =============================== GET =============================== */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await checkAdminAuthOrReject();
  if (auth instanceof NextResponse) {
    auth.headers.set("Cache-Control", noStore["Cache-Control"]);
    return auth;
  }

  try {
    const { id } = params;

    const contract = await db.contract.findUnique({
      where: { id },
      include: {
        room: { select: { id: true, roomNumber: true } },
        profile: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!contract) {
      return NextResponse.json(
        { success: false, error: "ไม่พบสัญญา" },
        { status: 404, headers: noStore }
      );
    }

    return NextResponse.json(
      {
        success: true,
        contract: {
          id: contract.id,
          startDate: contract.startDate,
          endDate: contract.endDate,
          contractDate: contract.contractDate,
          rentPerMonth: contract.rentPerMonth,
          dormOwnerName: contract.dormOwnerName,
          dormAddress: contract.dormAddress,
          contractImages: contract.contractImages ?? [],
          room: contract.room,
          tenant: contract.profile,
        },
      },
      { status: 200, headers: noStore }
    );
  } catch (err) {
    console.error("GET /api/admin/contracts/[id] error:", err);
    return NextResponse.json(
      { success: false, error: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500, headers: noStore }
    );
  }
}

/* ============================== PATCH ============================== */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await checkAdminAuthOrReject();
  if (auth instanceof NextResponse) {
    auth.headers.set("Cache-Control", noStore["Cache-Control"]);
    return auth;
  }

  try {
    const { id } = params;

    const json = await req.json();
    const parsed = UpdateSchema.safeParse(json);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง";
      return NextResponse.json(
        { success: false, error: msg },
        { status: 400, headers: noStore }
      );
    }
    const payload = parsed.data;

    // 1) ดึงค่าเดิม
    const existing = await db.contract.findUnique({
      where: { id },
      select: { id: true, roomId: true, startDate: true, endDate: true },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "ไม่พบสัญญา" },
        { status: 404, headers: noStore }
      );
    }

    // 2) วันใหม่ (ถ้าไม่ส่ง ใช้เดิม)
    const newStart = payload.startDate
      ? new Date(payload.startDate)
      : existing.startDate;
    const newEnd = payload.endDate
      ? new Date(payload.endDate)
      : existing.endDate;

    if (newEnd <= newStart) {
      return NextResponse.json(
        { success: false, error: "วันสิ้นสุดสัญญาต้องหลังวันเริ่มสัญญา" },
        { status: 400, headers: noStore }
      );
    }

    // 3) กันช่วงทับซ้อน
    const overlap = await db.contract.findFirst({
      where: {
        roomId: existing.roomId,
        id: { not: id },
        startDate: { lte: newEnd },
        endDate: { gte: newStart },
      },
      select: { id: true },
    });
    if (overlap) {
      return NextResponse.json(
        {
          success: false,
          error: "ช่วงวันที่สัญญาทับซ้อนกับสัญญาอื่นของห้องนี้",
        },
        { status: 400, headers: noStore }
      );
    }

    // 4) เตรียม updateData
    const updateData: ContractUpdateData = {};
    if (payload.startDate) updateData.startDate = newStart;
    if (payload.endDate) updateData.endDate = newEnd;
    if (typeof payload.contractDate === "string") {
      updateData.contractDate = new Date(payload.contractDate);
    }
    if (typeof payload.rentPerMonth === "number") {
      updateData.rentPerMonth = payload.rentPerMonth;
    }
    if (typeof payload.dormOwnerName === "string") {
      updateData.dormOwnerName = payload.dormOwnerName.trim();
    }
    if (typeof payload.dormAddress === "string") {
      updateData.dormAddress = payload.dormAddress.trim();
    }
    if (Object.prototype.hasOwnProperty.call(payload, "contractImages")) {
      updateData.contractImages = (payload.contractImages ?? []) as string[];
    }

    // 5) อัปเดต
    const updated = await db.contract.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        profileId: true,
        roomId: true,
        startDate: true,
        endDate: true,
        contractDate: true,
        rentPerMonth: true,
        dormOwnerName: true,
        dormAddress: true,
        contractImages: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        contract: { ...updated, contractImages: updated.contractImages ?? [] },
      },
      { status: 200, headers: noStore }
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
    console.error("PATCH /api/admin/contracts/[id] error:", err);
    return NextResponse.json(
      { success: false, error: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500, headers: noStore }
    );
  }
}

/* ============================== DELETE ============================== */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await checkAdminAuthOrReject();
  if (auth instanceof NextResponse) {
    auth.headers.set("Cache-Control", noStore["Cache-Control"]);
    return auth;
  }

  try {
    const { id } = params;

    const existed = await db.contract.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existed) {
      return NextResponse.json(
        { success: false, error: "ไม่พบสัญญา" },
        { status: 404, headers: noStore }
      );
    }

    await db.contract.delete({ where: { id } });
    return NextResponse.json(
      { success: true, message: "ลบสัญญาแล้ว" },
      { status: 200, headers: noStore }
    );
  } catch (err) {
    console.error("DELETE /api/admin/contracts/[id] error:", err);
    return NextResponse.json(
      { success: false, error: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500, headers: noStore }
    );
  }
}
