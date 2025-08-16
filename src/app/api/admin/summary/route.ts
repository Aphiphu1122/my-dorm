import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getUserIdFromCookie } from "@/lib/auth";

export async function GET() {
  const userId = await getUserIdFromCookie();

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // ห้อง
  const occupiedRooms = await db.room.count({
    where: { status: "OCCUPIED" },
  });

  const vacantRooms = await db.room.count({
    where: { status: "AVAILABLE" },
  });

  // ห้องที่มีบิลค้างชำระ
  const unpaidRooms = await db.bill.count({
    where: { status: "UNPAID" },
  });

  // คำนวณยอดชำระแล้ว/ยังไม่ชำระ
  const paidBills = await db.bill.findMany({
    where: { status: "PAID" },
    select: { totalAmount: true },
  });

  const unpaidBills = await db.bill.findMany({
    where: { status: "UNPAID" },
    select: { totalAmount: true },
  });

  const totalPaid = paidBills.reduce((sum, bill) => sum + bill.totalAmount, 0);
  const totalUnpaid = unpaidBills.reduce((sum, bill) => sum + bill.totalAmount, 0);

  // รายรับต่อเดือน (ย้อนหลัง 6 เดือน)
  const rawRevenue = await db.bill.findMany({
    where: { status: "PAID" },
    select: {
      paymentDate: true,
      totalAmount: true,
    },
  });

  const monthlyRevenueMap: { [month: string]: number } = {};

  for (const bill of rawRevenue) {
    const date = new Date(bill.paymentDate!);
    const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}`;

    if (!monthlyRevenueMap[monthKey]) {
      monthlyRevenueMap[monthKey] = 0;
    }

    monthlyRevenueMap[monthKey] += bill.totalAmount;
  }

  const monthlyRevenue = Object.entries(monthlyRevenueMap)
    .sort((a, b) => a[0].localeCompare(b[0])) // เรียงตามเวลา
    .slice(-6)
    .map(([month, revenue]) => ({ month, revenue }));

  // แนวโน้มสถานะการแจ้งซ่อม
  const maintenanceCounts = await db.maintenanceRequest.groupBy({
    by: ["status"],
    _count: {
      _all: true,
    },
  });

  const maintenanceTrend = maintenanceCounts.map((item) => ({
    status: item.status,
    count: item._count._all,
  }));

  const result = {
    occupiedRooms,
    vacantRooms,
    unpaidRooms,
    totalPaid,
    totalUnpaid,
    monthlyRevenue,
    maintenanceTrend,
  };

  return NextResponse.json(result);
}
