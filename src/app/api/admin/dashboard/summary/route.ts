import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getRoleFromCookie } from "@/lib/auth";
import dayjs from "dayjs";

export async function GET() {
  try {
    const role = await getRoleFromCookie();
    if (!role || role !== "admin") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const [totalRooms, occupiedRooms, unpaidRooms] = await Promise.all([
      db.room.count(),
      db.room.count({ where: { status: "OCCUPIED" } }),
      db.room.count({
        where: {
          status: "OCCUPIED",
          bills: { some: { status: "UNPAID" } },
        },
      }),
    ]);
    const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

    const bills = await db.bill.findMany({
      select: {
        status: true,
        totalAmount: true,
        paymentDate: true,
        rentAmount: true,
        waterRate: true,
        waterUnit: true,
        electricRate: true,
        electricUnit: true,
      },
    });

    const totalPaid = bills
      .filter((b) => b.status === "PAID")
      .reduce((sum, b) => sum + b.totalAmount, 0);

    const totalUnpaid = bills
      .filter((b) => b.status === "UNPAID")
      .reduce((sum, b) => sum + b.totalAmount, 0);

    const past6Months = Array.from({ length: 6 }, (_, i) =>
      dayjs().subtract(5 - i, "month").startOf("month")
    );

    const monthlyRevenue = past6Months.map((month) => {
      const label = month.format("MMM");
      const revenue = bills
        .filter(
          (b) =>
            b.status === "PAID" &&
            b.paymentDate &&
            dayjs(b.paymentDate).isSame(month, "month")
        )
        .reduce((sum, b) => sum + b.totalAmount, 0);
      return { month: label, revenue };
    });

    const revenueByCategory = past6Months.map((month) => {
      const label = month.format("MMM");
      const relevantBills = bills.filter(
        (b) =>
          b.status === "PAID" &&
          b.paymentDate &&
          dayjs(b.paymentDate).isSame(month, "month")
      );

      const rent = relevantBills.reduce((sum, b) => sum + b.rentAmount, 0);
      const water = relevantBills.reduce(
        (sum, b) => sum + b.waterRate * b.waterUnit,
        0
      );
      const electricity = relevantBills.reduce(
        (sum, b) => sum + b.electricRate * b.electricUnit,
        0
      );

      return { month: label, rent, water, electricity };
    });

    const maintenanceRequests = await db.maintenanceRequest.findMany({
      where: {
        createdAt: {
          gte: dayjs().subtract(5, "month").startOf("month").toDate(),
        },
      },
      select: {
        status: true,
        createdAt: true,
      },
    });

    const maintenanceTrend = past6Months.map((month) => {
      const label = month.format("MMM");
      const filtered = maintenanceRequests.filter((req) =>
        dayjs(req.createdAt).isSame(month, "month")
      );

      const grouped = {
        PENDING: 0,
        IN_PROGRESS: 0,
        COMPLETED: 0,
        CANCLE: 0,
      };

      filtered.forEach((req) => {
        const s = req.status as keyof typeof grouped;
        grouped[s] += 1;
      });

      return {
        month: label,
        ...grouped,
      };
    });

    return NextResponse.json({
      occupancyRate: parseFloat(occupancyRate.toFixed(2)),
      vacantRooms: totalRooms - occupiedRooms,
      occupiedRooms,
      unpaidRooms,
      totalPaid,
      totalUnpaid,
      monthlyRevenue,
      revenueByCategory,
      maintenanceTrend,
    });
  } catch (error) {
    console.error("Dashboard summary error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
