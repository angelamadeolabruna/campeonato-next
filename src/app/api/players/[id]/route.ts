import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromToken, unauthorized } from '@/lib/auth'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!getUserIdFromToken(request)) return unauthorized()
  const { id } = await params
  try {
    const { nombre, numero, foto, estado } = await request.json()
    const data: any = {}
    if (nombre) data.nombre = nombre
    if (numero !== undefined) data.numero = Number(numero)
    if (foto !== undefined) data.foto = foto
    if (estado) data.estado = estado
    const player = await prisma.player.update({ where: { id: Number(id) }, data })
    return NextResponse.json(player)
  } catch {
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!getUserIdFromToken(request)) return unauthorized()
  const { id } = await params
  const nid = Number(id)
  await prisma.goal.deleteMany({ where: { jugadorId: nid } })
  await prisma.card.deleteMany({ where: { jugadorId: nid } })
  await prisma.fine.deleteMany({ where: { jugadorId: nid } })
  await prisma.player.delete({ where: { id: nid } })
  return NextResponse.json({ message: 'Eliminado' })
}
