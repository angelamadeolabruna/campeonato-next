import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromToken, unauthorized } from '@/lib/auth'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!getUserIdFromToken(request)) return unauthorized()
  const { id } = await params
  const matchId = Number(id)

  try {
    const { golesLocal, golesVisit, goleadores, tarjetas } = await request.json()

    await prisma.goal.deleteMany({ where: { matchId } })
    await prisma.card.deleteMany({ where: { matchId } })

    await prisma.match.update({
      where: { id: matchId },
      data: { golesLocal: Number(golesLocal), golesVisit: Number(golesVisit), jugado: true },
    })

    if (goleadores?.length) {
      for (const g of goleadores) {
        await prisma.goal.create({ data: { matchId, jugadorId: Number(g.jugadorId), equipoId: Number(g.equipoId), cantidad: Number(g.cantidad) || 1 } })
        await prisma.player.update({ where: { id: Number(g.jugadorId) }, data: { estado: 'Activo' } })
      }
    }

    if (tarjetas?.length) {
      for (const c of tarjetas) {
        await prisma.card.create({ data: { matchId, jugadorId: Number(c.jugadorId), tipo: c.tipo } })
        const player = await prisma.player.findUnique({ where: { id: Number(c.jugadorId) } })
        if (player) {
          if (c.tipo === 'Amarilla') {
            const na = player.amarillas + 1
            await prisma.player.update({ where: { id: player.id }, data: { amarillas: na, ...(na >= 3 ? { estado: 'Suspendido' } : {}) } })
            await prisma.fine.create({ data: { jugadorId: player.id, monto: 20, motivo: 'Amarilla', matchId } })
          } else {
            await prisma.player.update({ where: { id: player.id }, data: { rojas: { increment: 1 }, estado: 'Suspendido' } })
            await prisma.fine.create({ data: { jugadorId: player.id, monto: 50, motivo: 'Roja', matchId } })
          }
        }
      }
    }

    const result = await prisma.match.findUnique({
      where: { id: matchId },
      include: { jornada: true, local: { select: { id: true, nombre: true } }, visitante: { select: { id: true, nombre: true } }, categoria: true, goles: { include: { jugador: { select: { id: true, nombre: true } } } }, tarjetas: { include: { jugador: { select: { id: true, nombre: true, equipo: { select: { nombre: true } } } } } } },
    })
    return NextResponse.json(result)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error al guardar resultado' }, { status: 500 })
  }
}
