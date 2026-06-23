import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromToken, unauthorized } from '@/lib/auth'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!getUserIdFromToken(request)) return unauthorized()
  const { id } = await params
  try {
    const { hora, cancha, arbitro } = await request.json()
    const match = await prisma.match.update({
      where: { id: Number(id) },
      data: { ...(hora !== undefined && { hora }), ...(cancha !== undefined && { cancha }), ...(arbitro !== undefined && { arbitro }) },
    })
    return NextResponse.json(match)
  } catch {
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })
  }
}
