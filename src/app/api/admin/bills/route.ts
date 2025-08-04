import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { z } from "zod";
import { getRoleFromCookie } from "@/lib/auth";

// ✅ Zod Validation
const billSchema = z.object({
  tenantId: z.string().uuid(),
  roomId: z.string().uuid(),
  billingMonth: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
  rentAmount: z.number().min(0),
  waterUnit: z.number().min(0),
  waterRate: z.number().min(0),
  electricUnit: z.number().min(0),
  electricRate: z.number().min(0),
});

// ✅ POST: สร้างบิลใหม่
export async function POST(req: Request) {
  try {
    const role = await getRoleFromCookie();
    if (role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = billSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const {
      tenantId,
      roomId,
      billingMonth,
      rentAmount,
      waterUnit,
      waterRate,
      electricUnit,
      electricRate,
    } = parsed.data;

    const totalAmount =
      rentAmount + waterUnit * waterRate + electricUnit * electricRate;

    const bill = await db.bill.create({
      data: {
        tenantId,
        roomId,
        billingMonth: new Date(billingMonth),
        rentAmount,
        waterUnit,
        waterRate,
        electricUnit,
        electricRate,
        totalAmount,
        status: "UNPAID",
      },
    });

    return NextResponse.json({ bill }, { status: 201 });
  } catch (error) {
    console.error("Create bill error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ✅ GET: ดึงรายการบิลทั้งหมด (เฉพาะ admin)
export async function GET() {
  try {
    const role = await getRoleFromCookie();
    if (role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const bills = await db.bill.findMany({
      orderBy: { billingMonth: "desc" },
      include: {
        room: { select: { roomNumber: true } },
        tenant: { select: { firstName: true, lastName: true } },
      },
    });

    return NextResponse.json(bills, { status: 200 });
  } catch (error) {
    console.error("Fetch bills error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
