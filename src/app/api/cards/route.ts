import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromToken, unauthorized } from '@/lib/auth'

export async function GET(request: NextRequest) {
  if (!getUserIdFromToken(request)) return unauthorized()
  const { searchParams } = new URL(request.url)
  const categoriaId = searchParams.get('categoriaId')
  const where: any = categoriaId ? { jugador: { equipo: { categoriaId: Number(categoriaId) } } } : {}
  const cards = await prisma.card.findMany({
    where,
    include: { jugador: { include: { equipo: { select: { id: true, nombre: true, categoriaId: true } } } }, match: { include: { jornada: { select: { numero: true } } } } },
    orderBy: { creadoEn: 'desc' },
  })
  return NextResponse.json(cards)
}
