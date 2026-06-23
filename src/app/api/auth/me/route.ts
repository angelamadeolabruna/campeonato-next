import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromToken, unauthorized } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const userId = getUserIdFromToken(request)
  if (!userId) return unauthorized()

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json({ id: user.id, username: user.username, nombre: user.nombre })
}
