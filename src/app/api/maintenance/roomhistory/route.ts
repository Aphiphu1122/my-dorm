import { NextResponse } from 'next/server';
import { getUserIdFromCookie } from '@/lib/auth';
import { db } from '@/lib/prisma';

// ✅ ดึงประวัติแจ้งซ่อมของผู้ใช้ (เรียงใหม่สุดก่อน)
export async function GET() {
  try {
    // 🔐 ตรวจสอบผู้ใช้จาก cookie
    const userId = await getUserIdFromCookie();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 📥 ดึงข้อมูลคำร้องแจ้งซ่อมทั้งหมดของผู้ใช้
    const requests = await db.maintenanceRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        category: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // 📤 ส่งข้อมูลกลับ
    return NextResponse.json({ requests }, { status: 200 });
  } catch (err) {
    console.error('[GET /api/maintenance/roomhistory]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
