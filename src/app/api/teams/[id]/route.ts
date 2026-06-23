import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromToken, unauthorized } from '@/lib/auth'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!getUserIdFromToken(request)) return unauthorized()
  const { id } = await params
  const nid = Number(id)
  if (!nid) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  const team = await prisma.team.findUnique({ where: { id: nid }, include: { categoria: true, jugadores: true } })
  if (!team) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json(team)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!getUserIdFromToken(request)) return unauthorized()
  const { id } = await params
  const nid = Number(id)
  if (!nid) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  try {
    const { nombre, logo } = await request.json()
    const team = await prisma.team.update({
      where: { id: nid },
      data: { ...(nombre && { nombre }), ...(logo !== undefined && { logo }) },
      include: { categoria: true },
    })
    return NextResponse.json(team)
  } catch {
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!getUserIdFromToken(request)) return unauthorized()
  const { id } = await params
  const nid = Number(id)
  if (!nid) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  const matchIds = (await prisma.match.findMany({
    where: { OR: [{ localId: nid }, { visitanteId: nid }] },
    select: { id: true },
  })).map(m => m.id)
  if (matchIds.length > 0) {
    await prisma.goal.deleteMany({ where: { matchId: { in: matchIds } } })
    await prisma.card.deleteMany({ where: { matchId: { in: matchIds } } })
    await prisma.fine.deleteMany({ where: { matchId: { in: matchIds } } })
  }
  await prisma.fine.deleteMany({ where: { jugador: { equipoId: nid } } })
  await prisma.player.deleteMany({ where: { equipoId: nid } })
  await prisma.match.deleteMany({ where: { localId: nid } })
  await prisma.match.deleteMany({ where: { visitanteId: nid } })
  await prisma.team.delete({ where: { id: nid } })
  return NextResponse.json({ message: 'Eliminado' })
}
