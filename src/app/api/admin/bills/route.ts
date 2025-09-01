import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { z } from "zod";
import { getRoleFromCookie } from "@/lib/auth";

const billSchema = z.object({
  tenantId: z.string().uuid(),
  roomId: z.string().uuid(),
  billingMonth: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
  rentAmount: z.number().min(0),

  waterPrev: z.number().min(0),
  waterCurr: z.number().min(0),
  waterRate: z.number().min(0),

  electricPrev: z.number().min(0),
  electricCurr: z.number().min(0),
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
      waterPrev,
      waterCurr,
      waterRate,
      electricPrev,
      electricCurr,
      electricRate,
    } = parsed.data;

    // ✅ คำนวณยูนิต
    const waterUnit = waterCurr - waterPrev;
    const electricUnit = electricCurr - electricPrev;

    if (waterUnit < 0 || electricUnit < 0) {
      return NextResponse.json(
        { error: "ค่า meter ใหม่ต้องมากกว่าหรือเท่ากับค่าเก่า" },
        { status: 400 }
      );
    }

    // ✅ คำนวณยอดรวม
    const totalAmount =
      rentAmount + waterUnit * waterRate + electricUnit * electricRate;

    const bill = await db.bill.create({
      data: {
        tenantId,
        roomId,
        billingMonth: new Date(billingMonth),
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
    });

 // ✅ แจ้งเตือนผู้เช่า
    await db.notification.create({
      data: {
        userId: tenantId,
        message: `📢 มีบิลใหม่ของเดือน ${new Date(
          billingMonth
        ).toLocaleDateString("th-TH", {
          year: "numeric",
          month: "long",
        })}`,
        type: "BILL_CREATED",
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
