// src/app/api/notifications/me/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getUserIdFromCookie } from "@/lib/auth";

/** เส้นทางอิงคุกกี้ → กันแคชทั้งหมด */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
const noStore = {
  "Cache-Control": "no-store, no-cache, must-revalidate, private",
} as const;

/** GET: ดึงแจ้งเตือนของผู้ใช้ (ใหม่สุดก่อน) */
export async function GET() {
  try {
    const userId = await getUserIdFromCookie();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: noStore });
    }

    const notifications = await db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ notifications }, { status: 200, headers: noStore });
  } catch (error) {
    console.error("Fetch notifications error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500, headers: noStore });
  }
}

/**
 * DELETE:
 * - ถ้าส่ง { ids: string[] } มา → ลบเฉพาะรายการนั้น
 * - ไม่ส่ง body → ลบทั้งหมดของผู้ใช้ (ให้สอดคล้องกับหน้า Home ที่ setNotifications([]))
 * อยากลบเฉพาะที่อ่านแล้ว ให้ปรับ where เป็น { userId, read: true }
 */
export async function DELETE(req: Request) {
  try {
    const userId = await getUserIdFromCookie();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: noStore });
    }

    let ids: string[] | undefined;
    try {
      if ((req.headers.get("content-type") || "").includes("application/json")) {
        const body = (await req.json()) as unknown;
        const arr = (body as { ids?: unknown })?.ids;
        if (Array.isArray(arr)) {
          ids = arr.filter((x): x is string => typeof x === "string");
        }
      }
    } catch {

    }

    if (ids?.length) {
      await db.notification.deleteMany({
        where: { userId, id: { in: ids } },
      });
    } else {
      // ลบทั้งหมดของผู้ใช้
      await db.notification.deleteMany({ where: { userId } });
      // ถ้าต้องการ “ลบเฉพาะที่อ่านแล้ว” แทน ให้ใช้:
      // await db.notification.deleteMany({ where: { userId, read: true } });
    }

    return NextResponse.json({ success: true }, { status: 200, headers: noStore });
  } catch (error) {
    console.error("Delete notifications error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500, headers: noStore });
  }
}
