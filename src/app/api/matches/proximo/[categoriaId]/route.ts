import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromToken, unauthorized } from '@/lib/auth'

export async function GET(request: NextRequest, { params }: { params: Promise<{ categoriaId: string }> }) {
  if (!getUserIdFromToken(request)) return unauthorized()
  const { categoriaId } = await params
  const where: any = { jugado: false, jornada: { fecha: { not: null } } }
  if (categoriaId) where.categoriaId = Number(categoriaId)
  const next = await prisma.match.findFirst({
    where,
    orderBy: [{ jornada: { fecha: 'asc' } }, { id: 'asc' }],
    include: { jornada: true, local: { select: { id: true, nombre: true } }, visitante: { select: { id: true, nombre: true } }, categoria: true },
  })
  return NextResponse.json(next)
}
