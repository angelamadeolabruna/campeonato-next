import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET || 'campeonato-futbol-secret-key-2026'

export function generateToken(userId: number): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '24h' })
}

export function getUserIdFromToken(request: NextRequest): number | null {
  // Check x-auth-token from middleware (cookie forwarded to API routes)
  const tokenFromCookie = request.headers.get('x-auth-token')
  if (tokenFromCookie) {
    try {
      const decoded = jwt.verify(tokenFromCookie, JWT_SECRET) as { userId: number }
      return decoded.userId
    } catch {
      // Token invalid - fall through to Authorization header
    }
  }

  // Fall back to Authorization header (client-side API calls)
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.split(' ')[1]
  if (!token) return null
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number }
    return decoded.userId
  } catch {
    return null
  }
}

export function unauthorized() {
  return Response.json({ error: 'No autorizado' }, { status: 401 })
}
