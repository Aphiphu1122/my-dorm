import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getRoleFromCookie } from "@/lib/auth";
import { z } from "zod";

export const runtime = "nodejs";

/** ใช้แทน any ตอน build ข้อมูล update ให้ Prisma */
type ContractUpdateData = Partial<{
  startDate: Date;
  endDate: Date;
  contractDate: Date;
  rentPerMonth: number;
  dormOwnerName: string;
  dormAddress: string;
  contractImages: string[];
}>;

/** Prisma error แบบบางเบา (ไม่ต้อง import type จาก @prisma/client) */
interface PrismaKnownError {
  code?: string;
  meta?: { target?: string[] };
}

/* -------------------- Zod schema สำหรับ PATCH -------------------- */
const UpdateSchema = z
  .object({
    // วันที่รับเป็น ISO string แล้วค่อยแปลงเป็น Date ด้านล่าง
    startDate: z
      .string()
      .optional()
      .refine((v) => v === undefined || !isNaN(Date.parse(v)), {
        message: "startDate ไม่ถูกต้อง",
      }),
    endDate: z
      .string()
      .optional()
      .refine((v) => v === undefined || !isNaN(Date.parse(v)), {
        message: "endDate ไม่ถูกต้อง",
      }),
    contractDate: z
      .string()
      .optional()
      .refine((v) => v === undefined || !isNaN(Date.parse(v)), {
        message: "contractDate ไม่ถูกต้อง",
      }),
    rentPerMonth: z.number().positive().optional(),
    dormOwnerName: z.string().min(1).optional(),
    dormAddress: z.string().min(1).optional(),
    contractImages: z.array(z.string().url()).max(10).optional(),
  })
  .refine((o) => Object.keys(o).length > 0, { message: "ไม่มีข้อมูลสำหรับแก้ไข" });

/* =============================== GET =============================== */
/** GET /api/admin/contracts/[id]
 *  ดึงรายละเอียดสัญญา (รวมข้อมูลห้องและผู้เช่าแบบย่อ)
 */
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const role = await getRoleFromCookie();
    if (role !== "admin") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const id = params.id;

    const contract = await db.contract.findUnique({
      where: { id },
      include: {
        room: { select: { id: true, roomNumber: true } },
        profile: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    if (!contract) {
      return NextResponse.json({ success: false, error: "ไม่พบสัญญา" }, { status: 404 });
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
          contractImages: contract.contractImages,
          room: contract.room,
          tenant: contract.profile,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("GET /api/admin/contracts/[id] error:", err);
    return NextResponse.json(
      { success: false, error: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 }
    );
  }
}

/* ============================== PATCH ============================== */
/** PATCH /api/admin/contracts/[id]
 *  อนุญาตให้แก้เฉพาะผู้ดูแล (admin)
 *  - ตรวจรูปแบบข้อมูล
 *  - ตรวจวันเริ่ม/สิ้นสุด
 *  - ตรวจทับซ้อนกับสัญญาห้องเดียวกัน (ยกเว้นสัญญาตัวเอง)
 */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const role = await getRoleFromCookie();
    if (role !== "admin") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const id = params.id;
    const json = await req.json();
    const parsed = UpdateSchema.safeParse(json);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง";
      return NextResponse.json({ success: false, error: msg }, { status: 400 });
    }
    const payload = parsed.data;

    // 1) หา contract เดิม
    const existing = await db.contract.findUnique({
      where: { id },
      select: {
        id: true,
        roomId: true,
        startDate: true,
        endDate: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "ไม่พบสัญญา" }, { status: 404 });
    }

    // 2) คำนวณช่วงวันที่ใหม่ (ถ้าไม่ได้ส่งมาก็ใช้ของเดิม)
    const newStart = payload.startDate ? new Date(payload.startDate) : existing.startDate;
    const newEnd = payload.endDate ? new Date(payload.endDate) : existing.endDate;

    if (newEnd <= newStart) {
      return NextResponse.json(
        { success: false, error: "วันสิ้นสุดสัญญาต้องหลังวันเริ่มสัญญา" },
        { status: 400 }
      );
    }

    // 3) ตรวจทับซ้อนกับสัญญา "ห้องเดียวกัน" ตัวอื่น
    // overlap logic: existing.start <= newEnd AND existing.end >= newStart
    const overlap = await db.contract.findFirst({
      where: {
        roomId: existing.roomId,
        id: { not: id },
        startDate: { lte: newEnd },
        endDate: { gte: newStart },
      },
      select: { id: true, startDate: true, endDate: true },
    });

    if (overlap) {
      return NextResponse.json(
        {
          success: false,
          error: "ช่วงวันที่สัญญาทับซ้อนกับสัญญาอื่นของห้องนี้",
        },
        { status: 400 }
      );
    }

    // 4) สร้างข้อมูลอัปเดต (type-safe)
    const updateData: ContractUpdateData = {};
    if (payload.startDate) updateData.startDate = newStart;
    if (payload.endDate) updateData.endDate = newEnd;
    if (payload.contractDate) updateData.contractDate = new Date(payload.contractDate);
    if (typeof payload.rentPerMonth === "number") updateData.rentPerMonth = payload.rentPerMonth;
    if (typeof payload.dormOwnerName === "string") updateData.dormOwnerName = payload.dormOwnerName.trim();
    if (typeof payload.dormAddress === "string") updateData.dormAddress = payload.dormAddress.trim();
    if (payload.contractImages) updateData.contractImages = payload.contractImages;

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

    return NextResponse.json({ success: true, contract: updated }, { status: 200 });
  } catch (err: unknown) {
    const e = err as PrismaKnownError;
    if (e.code === "P2002") {
      const fields = e.meta?.target?.join(", ") ?? "field";
      return NextResponse.json(
        { success: false, error: `ข้อมูลซ้ำใน ${fields}` },
        { status: 409 }
      );
    }
    console.error("PATCH /api/admin/contracts/[id] error:", err);
    return NextResponse.json(
      { success: false, error: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 }
    );
  }
}

/* ============================== DELETE ============================== */
/** (ตัวเลือก) ลบสัญญา – อนุญาตเฉพาะ admin
 *  ใช้เมื่อต้องการลบรายการที่สร้างผิด (ควรใช้ด้วยความระมัดระวัง)
 */
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const role = await getRoleFromCookie();
    if (role !== "admin") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const id = params.id;

    // ตรวจว่ามีอยู่จริง
    const existed = await db.contract.findUnique({ where: { id }, select: { id: true } });
    if (!existed) {
      return NextResponse.json({ success: false, error: "ไม่พบสัญญา" }, { status: 404 });
    }

    await db.contract.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "ลบสัญญาแล้ว" }, { status: 200 });
  } catch (err) {
    console.error("DELETE /api/admin/contracts/[id] error:", err);
    return NextResponse.json(
      { success: false, error: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 }
    );
  }
}
