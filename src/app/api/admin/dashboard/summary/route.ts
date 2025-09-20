// src/app/api/admin/dashboard/summary/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getRoleFromCookie } from "@/lib/auth";
import dayjs from "dayjs";

/** ✅ เส้นทางอาศัยคุกกี้ → กันแคชทั้งหมด และบังคับ Node runtime */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
const noStore = { "Cache-Control": "no-store, no-cache, must-revalidate, private" } as const;

export async function GET(request: Request) {
  try {
    const role = await getRoleFromCookie();
    if (role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: noStore });
    }

    /** ---------- parse year param ---------- */
    const url = new URL(request.url);
    const yearParam = url.searchParams.get("year");
    const parsedYear = Number.isFinite(Number(yearParam)) ? parseInt(String(yearParam), 10) : dayjs().year();
    const year = Number.isFinite(parsedYear) ? parsedYear : dayjs().year();

    const startOfYear = dayjs(`${year}-01-01`).startOf("year");
    const endOfYear = startOfYear.endOf("year");
    const months = Array.from({ length: 12 }, (_, i) => startOfYear.add(i, "month"));

    /** ---------- queries (รันขนาน) ---------- */
    const [
      totalRooms,
      currentOccupiedRooms,     // สถานะปัจจุบัน
      vacantRooms,              // สถานะปัจจุบัน
      unpaidRoomsDistinct,      // ห้องที่มีบิลค้างในปีนี้ (ไม่นับซ้ำ)
      bills,                    // บิลทั้งปี (อิงเดือนของบิล)
      maintenanceRequests,      // แจ้งซ่อมทั้งปี
      newTenanciesThisYear,     // ห้องที่เพิ่งมีผู้เช่าในปีนี้ (assignedAt)
    ] = await Promise.all([
      db.room.count(),
      db.room.count({ where: { status: "OCCUPIED" } }),
      db.room.count({ where: { status: "AVAILABLE" } }),
      db.bill.findMany({
        where: {
          status: "UNPAID",
          createdAt: { gte: startOfYear.toDate(), lte: endOfYear.toDate() },
        },
        select: { roomId: true },
        distinct: ["roomId"],
      }),
      db.bill.findMany({
        where: {
          // ✅ ใช้เดือนของบิล (billingMonth) สำหรับสถิติตามเดือน
          billingMonth: { gte: startOfYear.toDate(), lte: endOfYear.toDate() },
        },
        select: {
          status: true,
          totalAmount: true,
          paymentDate: true,
          rentAmount: true,
          waterRate: true,
          waterUnit: true,
          electricRate: true,
          electricUnit: true,
          billingMonth: true,
          createdAt: true,
        },
      }),
      db.maintenanceRequest.findMany({
        where: { createdAt: { gte: startOfYear.toDate(), lte: endOfYear.toDate() } },
        select: { status: true, createdAt: true },
      }),
      db.room.count({
        where: { assignedAt: { gte: startOfYear.toDate(), lte: endOfYear.toDate() } },
      }),
    ]);

    /** ---------- ตัวเลขรวม ---------- */
    const unpaidRooms = unpaidRoomsDistinct.length;
    const occupancyRate = totalRooms > 0 ? (currentOccupiedRooms / totalRooms) * 100 : 0;

    // รวมยอดรวมทั้งปี (ตามสถานะ)
    const totalPaid = bills.filter((b) => b.status === "PAID").reduce((s, b) => s + b.totalAmount, 0);
    const totalUnpaid = bills.filter((b) => b.status === "UNPAID").reduce((s, b) => s + b.totalAmount, 0);

    /** ---------- helper: เช็กอยู่เดือนเดียวกัน ---------- */
    const isSameMonth = (d: Date | string | null | undefined, m: dayjs.Dayjs) =>
      !!d && dayjs(d).isSame(m, "month");

    /** ---------- รายได้รวมต่อเดือน (อ้างอิงวันชำระจริง) ---------- */
    const monthlyRevenue = months.map((m) => {
      const revenue = bills
        .filter((b) => b.status === "PAID" && isSameMonth(b.paymentDate, m))
        .reduce((s, b) => s + b.totalAmount, 0);
      return { month: m.format("MMM"), revenue };
    });

    /** ---------- รายได้แยกประเภท (อ้างอิงวันชำระจริง) ---------- */
    const revenueByCategory = months.map((m) => {
      const paidBillsThisMonth = bills.filter((b) => b.status === "PAID" && isSameMonth(b.paymentDate, m));
      const rent = paidBillsThisMonth.reduce((s, b) => s + b.rentAmount, 0);
      const water = paidBillsThisMonth.reduce((s, b) => s + b.waterRate * b.waterUnit, 0);
      const electricity = paidBillsThisMonth.reduce((s, b) => s + b.electricRate * b.electricUnit, 0);
      return { month: m.format("MMM"), rent, water, electricity };
    });

    /** ---------- Paid / Unpaid ต่อเดือน (อิงเดือนของบิล) ---------- */
    const monthlyPaidUnpaid = months.map((m) => {
      const billsOfMonth = bills.filter((b) => isSameMonth(b.billingMonth, m));
      const paid = billsOfMonth.filter((b) => b.status === "PAID").reduce((s, b) => s + b.totalAmount, 0);
      const unpaid = billsOfMonth.filter((b) => b.status === "UNPAID").reduce((s, b) => s + b.totalAmount, 0);
      return { month: m.format("MMM"), paid, unpaid };
    });

    /** ---------- แนวโน้มการแจ้งซ่อม ---------- */
    // หมายเหตุ: ให้ key ตรงกับ enum ใน schema ของคุณ (เช่น CANCELED/CANCELLED)
    const STATUS_KEYS = ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELED"] as const;
    const makeZero = () => Object.fromEntries(STATUS_KEYS.map((k) => [k, 0])) as Record<(typeof STATUS_KEYS)[number], number>;

    const maintenanceTrend = months.map((m) => {
      const grouped = makeZero();
      maintenanceRequests
        .filter((r) => isSameMonth(r.createdAt, m))
        .forEach((r) => {
          const key = (r.status as string).toUpperCase();
          if (key in grouped) grouped[key as keyof typeof grouped] += 1;
          // ถ้า schema ใช้ "CANCELLED" ให้เพิ่ม mapping เล็ก ๆ ได้ เช่น:
          if (key === "CANCELLED") grouped["CANCELED"] += 1;
        });
      return { month: m.format("MMM"), ...grouped };
    });

    return NextResponse.json(
      {
        // ภาพรวม
        occupancyRate: Number(occupancyRate.toFixed(2)),
        occupiedRooms: currentOccupiedRooms,
        vacantRooms,
        unpaidRooms,
        newTenanciesThisYear, // เสริม: ห้องที่เพิ่งมีผู้เช่าในปีนี้ (อ้างอิง assignedAt)
        // รายได้
        totalPaid,
        totalUnpaid,
        monthlyRevenue,
        revenueByCategory,
        monthlyPaidUnpaid,
        // แจ้งซ่อม
        maintenanceTrend,
      },
      { status: 200, headers: noStore }
    );
  } catch (error) {
    console.error("Dashboard summary error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500, headers: noStore });
  }
}
