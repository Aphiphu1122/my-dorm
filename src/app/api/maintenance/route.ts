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
    const images = formData.getAll('images') as File[]

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

    //  ตรวจสอบว่าผู้ใช้มีห้อง
    const profile = await db.profile.findUnique({
      where: { id: userId },
      include: { room: true },
    })

    if (!profile?.room) {
      console.log('❌ No room assigned')
      return NextResponse.json({ error: 'User has no room assigned' }, { status: 400 })
    }

    // ✅ อัปโหลดหลายรูป
    const uploadedUrls: string[] = []

    for (const image of images) {
      if (image.size > 0) {
        try {
          const url = await uploadImageToStorage(image, `maintenance/${uuidv4()}.jpg`)
          uploadedUrls.push(url)
          console.log('✅ Uploaded image:', url)
        } catch (uploadErr) {
          console.error('❌ Upload failed:', uploadErr)
          return NextResponse.json({ error: 'Upload failed' }, { status: 400 })
        }
      }
    }

    await db.maintenanceRequest.create({
      data: {
        description,
        category,
        imageUrls: uploadedUrls,
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
