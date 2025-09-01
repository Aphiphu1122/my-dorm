import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getRoleFromCookie } from "@/lib/auth";
import dayjs from "dayjs";

export async function GET(request: Request) {
  try {
    const role = await getRoleFromCookie();
    if (!role || role !== "admin") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const url = new URL(request.url);
    const yearParam = url.searchParams.get("year");
    const year = yearParam ? parseInt(yearParam, 10) : dayjs().year();

    const startOfYear = dayjs(`${year}-01-01`).startOf("year");
    const endOfYear = startOfYear.endOf("year");

    // ✅ ห้องพักทั้งหมด (ไม่ขึ้นกับปี)
    const totalRooms = await db.room.count();

    // ✅ ห้องที่มีการเช็คอินในปีที่เลือก (ใช้ roomStartDate)
    const occupiedRooms = await db.profile.count({
      where: {
        roomId: { not: null },
        roomStartDate: {
          gte: startOfYear.toDate(),
          lte: endOfYear.toDate(),
        },
      },
    });

    // ✅ ห้องที่ว่างในปีที่เลือก
    const vacantRooms = await db.room.count({
      where: {
        status: "AVAILABLE",
        createdAt: {
          lte: endOfYear.toDate(), // ห้องที่มีอยู่แล้วในปีนี้
        },
      },
    });

    // ✅ ค้างชำระ (filter ตามปี)
    const unpaidRooms = await db.bill.count({
      where: {
        status: "UNPAID",
        createdAt: {
          gte: startOfYear.toDate(),
          lte: endOfYear.toDate(),
        },
      },
    });

    const occupancyRate =
      totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

    // ✅ ดึงบิลของปีที่เลือก
    const bills = await db.bill.findMany({
      where: {
        createdAt: {
          gte: startOfYear.toDate(),
          lte: endOfYear.toDate(),
        },
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
      },
    });

    const totalPaid = bills
      .filter((b) => b.status === "PAID")
      .reduce((sum, b) => sum + b.totalAmount, 0);

    const totalUnpaid = bills
      .filter((b) => b.status === "UNPAID")
      .reduce((sum, b) => sum + b.totalAmount, 0);

    // ✅ สร้าง array ของเดือนในปีนั้น
    const months = Array.from({ length: 12 }, (_, i) =>
      startOfYear.add(i, "month")
    );

    // ✅ รายได้รวมต่อเดือน
    const monthlyRevenue = months.map((month) => {
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

    // ✅ รายได้แยกตามประเภท
    const revenueByCategory = months.map((month) => {
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

    // ✅ แจ้งซ่อมของปีที่เลือก
    const maintenanceRequests = await db.maintenanceRequest.findMany({
      where: {
        createdAt: {
          gte: startOfYear.toDate(),
          lte: endOfYear.toDate(),
        },
      },
      select: {
        status: true,
        createdAt: true,
      },
    });

    const maintenanceTrend = months.map((month) => {
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

      return { month: label, ...grouped };
    });

    return NextResponse.json({
      occupancyRate: parseFloat(occupancyRate.toFixed(2)),
      vacantRooms,
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
