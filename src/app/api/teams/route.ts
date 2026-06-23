import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromToken, unauthorized } from '@/lib/auth'

export async function GET(request: NextRequest) {
  if (!getUserIdFromToken(request)) return unauthorized()
  const teams = await prisma.team.findMany({
    include: { categoria: true, _count: { select: { jugadores: true } } },
    orderBy: [{ categoriaId: 'asc' }, { nombre: 'asc' }],
  })
  return NextResponse.json(teams)
}

export async function POST(request: NextRequest) {
  if (!getUserIdFromToken(request)) return unauthorized()
  try {
    const { nombre, categoriaId, logo } = await request.json()
    if (!nombre || !categoriaId) return NextResponse.json({ error: 'Nombre y categoría requeridos' }, { status: 400 })
    const team = await prisma.team.create({ data: { nombre, categoriaId: Number(categoriaId), logo }, include: { categoria: true } })
    return NextResponse.json(team, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Error al crear equipo' }, { status: 500 })
  }
}
