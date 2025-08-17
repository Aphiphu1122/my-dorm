import { NextRequest, NextResponse } from 'next/server'
import { getUserIdFromCookie } from '@/lib/auth'
import { db } from '@/lib/prisma'
import { v4 as uuidv4 } from 'uuid'
import { uploadImageToStorage } from '@/lib/uploadImageToStorage'
import { MaintenanceCategory } from '@prisma/client'

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdFromCookie()
    if (!userId) {
      console.log('❌ Unauthorized')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const description = formData.get('description') as string
    const categoryRaw = formData.get('category') as string
    const image = formData.get('image') as File | null

    console.log('💬 description:', description)
    console.log('📂 category:', categoryRaw)
    console.log('🖼️ image:', image)

    if (!description || !categoryRaw) {
      console.log('❌ Missing fields')
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const category = categoryRaw.toUpperCase() as MaintenanceCategory

    const enumValues = Object.values(MaintenanceCategory)
    console.log('✅ Enum values:', enumValues)

    if (!enumValues.includes(category)) {
      console.log('❌ Invalid category:', category)
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
    }

    // ✅ ตรวจสอบว่าผู้ใช้มีห้อง
    const profile = await db.profile.findUnique({
      where: { id: userId },
      include: { room: true },
    })

    if (!profile?.room) {
      console.log('❌ No room assigned')
      return NextResponse.json({ error: 'User has no room assigned' }, { status: 400 })
    }

    // ✅ อัปโหลดรูปถ้ามี
    let imageUrl: string | null = null
    if (image && image.size > 0) {
      try {
        imageUrl = await uploadImageToStorage(image, `maintenance/${uuidv4()}.jpg`)
        console.log('✅ Uploaded image:', imageUrl)
      } catch (uploadErr) {
        console.error('❌ Upload failed:', uploadErr)
        return NextResponse.json({ error: 'Upload failed' }, { status: 400 })
      }
    }

    // ✅ บันทึกคำร้อง
    await db.maintenanceRequest.create({
      data: {
        description,
        category,
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
