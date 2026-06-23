import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromToken, unauthorized } from '@/lib/auth'

export async function GET(request: NextRequest, { params }: { params: Promise<{ equipoId: string }> }) {
  if (!getUserIdFromToken(request)) return unauthorized()
  const { equipoId } = await params
  const players = await prisma.player.findMany({
    where: { equipoId: Number(equipoId) },
    orderBy: { numero: 'asc' },
  })
  return NextResponse.json(players)
}
