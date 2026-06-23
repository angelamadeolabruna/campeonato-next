import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromToken, unauthorized } from '@/lib/auth'

export async function GET(request: NextRequest) {
  if (!getUserIdFromToken(request)) return unauthorized()
  const { searchParams } = new URL(request.url)
  const categoriaId = searchParams.get('categoriaId')
  const where: any = { pagado: false }
  if (categoriaId) where.jugador = { equipo: { categoriaId: Number(categoriaId) } }

  const multas = await prisma.fine.findMany({
    where,
    include: { jugador: { include: { equipo: { select: { id: true, nombre: true, categoriaId: true } } } }, match: { select: { id: true, jornada: { select: { numero: true } } } } },
    orderBy: { creadoEn: 'desc' },
  })
  return NextResponse.json(multas)
}
