import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromToken, unauthorized } from '@/lib/auth'

export async function GET(request: NextRequest) {
  if (!getUserIdFromToken(request)) return unauthorized()
  const players = await prisma.player.findMany({
    include: { equipo: { include: { categoria: true } } },
    orderBy: [{ equipo: { categoriaId: 'asc' } }, { equipoId: 'asc' }, { nombre: 'asc' }],
  })
  return NextResponse.json(players)
}

export async function POST(request: NextRequest) {
  if (!getUserIdFromToken(request)) return unauthorized()
  try {
    const { nombre, numero, foto, equipoId } = await request.json()
    if (!nombre || numero === undefined || !equipoId)
      return NextResponse.json({ error: 'Nombre, número y equipo requeridos' }, { status: 400 })
    const player = await prisma.player.create({ data: { nombre, numero: Number(numero), foto, equipoId: Number(equipoId) } })
    return NextResponse.json(player, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Error al crear jugador' }, { status: 500 })
  }
}
