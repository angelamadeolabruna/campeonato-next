import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromToken, unauthorized } from '@/lib/auth'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!getUserIdFromToken(request)) return unauthorized()
  const { id } = await params
  const matchId = Number(id)

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      jornada: true,
      local: {
        select: {
          id: true, nombre: true,
          jugadores: { select: { id: true, nombre: true, numero: true } }
        }
      },
      visitante: {
        select: {
          id: true, nombre: true,
          jugadores: { select: { id: true, nombre: true, numero: true } }
        }
      },
      categoria: true,
      goles: { include: { jugador: { select: { id: true, nombre: true } } } },
      tarjetas: { include: { jugador: { select: { id: true, nombre: true, equipo: { select: { nombre: true } } } } } },
    },
  })

  if (!match) {
    return NextResponse.json({ error: 'Partido no encontrado' }, { status: 404 })
  }

  return NextResponse.json(match)
}
