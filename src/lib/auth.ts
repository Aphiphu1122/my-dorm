import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// ✅ ดึง userId จาก cookie (async)
export async function getUserIdFromCookie(): Promise<string | null> {
  const cookieStore = await cookies()
  const userId = cookieStore.get('userId')?.value
  return userId || null
}

export async function getRoleFromCookie(): Promise<string | null> {
  const cookieStore = await cookies()
  const role = cookieStore.get('role')?.value
  return role || null
}

export async function checkAdminRole(): Promise<boolean> {
  const role = await getRoleFromCookie()
  return role === 'admin'
}

export async function checkAdminAuthOrReject(): Promise<string | NextResponse> {
  const userId = await getUserIdFromCookie()
  const role = await getRoleFromCookie()

  if (!userId || role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return userId
}