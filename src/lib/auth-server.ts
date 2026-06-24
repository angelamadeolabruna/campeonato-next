import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'campeonato-futbol-secret-key-2026'

export async function getUserId(): Promise<number | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value
    if (!token) return null
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number }
    return decoded.userId
  } catch {
    return null
  }
}

export async function requireAuth(): Promise<number> {
  const userId = await getUserId()
  if (!userId) redirect('/login')
  return userId
}
