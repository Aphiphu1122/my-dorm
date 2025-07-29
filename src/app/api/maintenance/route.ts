import { NextRequest, NextResponse } from 'next/server'
import { getUserIdFromCookie } from '@/lib/auth'
import { db } from '@/lib/prisma'
import { v4 as uuidv4 } from 'uuid'
import { uploadImageToStorage } from '@/lib/uploadImageToStorage'
import { MaintenanceCategory } from '@prisma/client' // ✅ ต้องเพิ่ม

export async function POST(req: NextRequest) {
  try {
    // 🔐 ตรวจสอบสิทธิ์ผู้ใช้
    const userId = await getUserIdFromCookie()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // 📥 รับค่าจาก formData
    const formData = await req.formData()
    const description = formData.get('description') as string
    const category = (formData.get('category') as string).toUpperCase()
    const image = formData.get('image') as File | null

    if (!description || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 🏠 ตรวจสอบว่าผู้ใช้มีห้องเช่าอยู่หรือไม่
    const profile = await db.profile.findUnique({
      where: { id: userId },
      include: { room: true },
    })

    if (!profile?.room) {
      return NextResponse.json({ error: 'User has no room assigned' }, { status: 400 })
    }

    // 📸 อัปโหลดรูปภาพ (ถ้ามี)
    let imageUrl: string | null = null
    if (image && image.size > 0) {
      imageUrl = await uploadImageToStorage(image, `maintenance/${uuidv4()}.jpg`)
    }

    // 📝 บันทึกคำร้อง
    await db.maintenanceRequest.create({
      data: {
        description,
        category: category as MaintenanceCategory,
        imageUrl,
        userId,
        roomId: profile.room.id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[POST /api/maintenance]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
