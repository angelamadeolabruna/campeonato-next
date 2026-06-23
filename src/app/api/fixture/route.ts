import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromToken, unauthorized } from '@/lib/auth'

export async function GET(request: NextRequest) {
  if (!getUserIdFromToken(request)) return unauthorized()
  const jornadas = await prisma.jornada.findMany({
    orderBy: { numero: 'asc' },
    include: {
      partidos: {
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

export async function DELETE(request: NextRequest) {
  if (!getUserIdFromToken(request)) return unauthorized()
  try {
    // Delete all goals, cards, and fines associated with matches first (to respect foreign keys if any)
    await prisma.goal.deleteMany()
    await prisma.card.deleteMany()
    // For fines, only delete those related to matches or set matchId to null. 
    // Usually wiping fixture implies wiping match events.
    await prisma.fine.updateMany({ data: { matchId: null } })
    
    await prisma.match.deleteMany()
    await prisma.jornada.deleteMany()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error al eliminar fixture' }, { status: 500 })
  }
}
