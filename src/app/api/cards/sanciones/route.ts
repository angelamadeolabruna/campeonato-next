import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromToken, unauthorized } from '@/lib/auth'

export async function GET(request: NextRequest) {
  if (!getUserIdFromToken(request)) return unauthorized()
  const { searchParams } = new URL(request.url)
  const categoriaId = searchParams.get('categoriaId')
  const where: any = { estado: 'Suspendido' }
  if (categoriaId) where.equipo = { categoriaId: Number(categoriaId) }
  const suspendidos = await prisma.player.findMany({
    where,
    include: { equipo: { select: { id: true, nombre: true, categoriaId: true } } },
    orderBy: { nombre: 'asc' },
  })
  return NextResponse.json(suspendidos)
}
