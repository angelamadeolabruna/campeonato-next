import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromToken, unauthorized } from '@/lib/auth'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!getUserIdFromToken(request)) return unauthorized()
  const { id } = await params
  const fine = await prisma.fine.update({ where: { id: Number(id) }, data: { pagado: true } })
  const pending = await prisma.fine.count({ where: { jugadorId: fine.jugadorId, pagado: false } })
  if (pending === 0) {
    const player = await prisma.player.findUnique({ where: { id: fine.jugadorId } })
    if (player && player.estado === 'Inhabilitado') await prisma.player.update({ where: { id: fine.jugadorId }, data: { estado: 'Activo' } })
  }
  return NextResponse.json(fine)
}
