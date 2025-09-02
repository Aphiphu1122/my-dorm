import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getUserIdFromCookie } from "@/lib/auth";

// ✅ ดึงรายละเอียดรายการซ่อมตาม id
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestId = params.id;

  try {
    const request = await db.maintenanceRequest.findUnique({
      where: { id: requestId },
      include: {
        room: {
          select: {
            id: true,
            roomNumber: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!request) {
      return NextResponse.json(
        { error: "Maintenance request not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ request });
  } catch (error) {
    console.error("[GET /api/admin/maintenance/[id]]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// ✅ อัปเดตสถานะรายการซ่อมตาม id
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestId = params.id;

  try {
    // ✅ ดึง userId จาก cookie
    const userId = await getUserIdFromCookie();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ ตรวจสอบว่าเป็น admin
    const profile = await db.profile.findUnique({
      where: { id: userId },
    });

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { status } = await req.json();

    // ✅ ดึงคำร้องเพื่อเอา userId ของผู้ใช้เจ้าของ
    const request = await db.maintenanceRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      return NextResponse.json({ error: "Maintenance request not found" }, { status: 404 });
    }

    //  อัปเดตสถานะ
    const updated = await db.maintenanceRequest.update({
      where: { id: requestId },
      data: { status },
    });

    //  ถ้า COMPLETED หรือ CANCEL → สร้าง Notification
    if (status === "COMPLETED" || status === "CANCEL") {
      await db.notification.create({
        data: {
          userId: request.userId,
          message:
            status === "COMPLETED"
              ? "📢 คำร้องแจ้งซ่อมของคุณได้รับการแก้ไขเรียบร้อยแล้ว ✅"
              : "📢 คำร้องแจ้งซ่อมของคุณถูกยกเลิก ❌",
          type: "MAINTENANCE",
        },
      });
    }

    return NextResponse.json({ success: true, updated });
  } catch (error) {
    console.error("[PATCH /api/admin/maintenance/[id]]", error);
    return NextResponse.json(
      { error: "Failed to update status" },
      { status: 500 }
    );
  }
}
