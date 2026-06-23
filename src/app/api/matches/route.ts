import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromToken, unauthorized } from '@/lib/auth'

export async function GET(request: NextRequest) {
  if (!getUserIdFromToken(request)) return unauthorized()
  const matches = await prisma.match.findMany({
    orderBy: [{ jornada: { numero: 'asc' } }, { id: 'asc' }],
    include: {
      jornada: true,
      local: { select: { id: true, nombre: true } },
      visitante: { select: { id: true, nombre: true } },
      categoria: true,
      goles: { include: { jugador: { select: { id: true, nombre: true } } } },
      tarjetas: { include: { jugador: { select: { id: true, nombre: true, equipo: { select: { nombre: true } } } } } },
    },
  })
  return NextResponse.json(matches)
}
