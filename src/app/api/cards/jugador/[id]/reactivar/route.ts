import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromToken, unauthorized } from '@/lib/auth'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!getUserIdFromToken(request)) return unauthorized()
  const { id } = await params
  const player = await prisma.player.update({ where: { id: Number(id) }, data: { estado: 'Activo', amarillas: 0 } })
  return NextResponse.json(player)
}
