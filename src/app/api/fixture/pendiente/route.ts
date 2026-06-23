import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromToken, unauthorized } from '@/lib/auth'

export async function GET(request: NextRequest) {
  if (!getUserIdFromToken(request)) return unauthorized()
  const jornadas = await prisma.jornada.findMany({
    where: { partidos: { some: { jugado: false } } },
    orderBy: { numero: 'asc' },
    include: {
      partidos: {
        where: { jugado: false },
        include: {
          local: { select: { id: true, nombre: true } },
          visitante: { select: { id: true, nombre: true } },
          categoria: { select: { id: true, nombre: true, color: true } },
        },
        orderBy: { id: 'asc' },
      },
    },
  })
  return NextResponse.json(jornadas)
}
