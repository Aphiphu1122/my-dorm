import { NextRequest, NextResponse } from 'next/server'
import { getUserIdFromCookie } from '@/lib/auth'
import { db } from '@/lib/prisma'

export async function GET(_req: NextRequest) {
  try {
    const userId = await getUserIdFromCookie()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
    })

    return NextResponse.json({ requests })
  } catch (err) {
    console.error('[GET /api/maintenance/roomhistory]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
