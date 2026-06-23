import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromToken, unauthorized } from '@/lib/auth'

export async function GET(request: NextRequest) {
  if (!getUserIdFromToken(request)) return unauthorized()
  try {
    const teams = await prisma.team.findMany({ include: { categoria: true } })
    const allMatches = await prisma.match.findMany({ where: { jugado: true } })

    const posiciones = teams.map(team => {
      const tm = allMatches.filter(m => m.localId === team.id || m.visitanteId === team.id)
      const pj = tm.length
      const pg = tm.filter(m => (m.localId === team.id && m.golesLocal > m.golesVisit) || (m.visitanteId === team.id && m.golesVisit > m.golesLocal)).length
      const pe = tm.filter(m => m.golesLocal === m.golesVisit).length
      const pp = pj - pg - pe
      const gf = tm.reduce((s, m) => s + (m.localId === team.id ? m.golesLocal : m.golesVisit), 0)
      const gc = tm.reduce((s, m) => s + (m.localId === team.id ? m.golesVisit : m.golesLocal), 0)
      return { id: team.id, nombre: team.nombre, categoria: team.categoria.nombre, pj, pg, pe, pp, gf, gc, dg: gf - gc, puntos: pg * 3 + pe }
    })

    return NextResponse.json({
      damas: posiciones.filter(p => p.categoria === 'Damas'),
      varones: posiciones.filter(p => p.categoria === 'Varones'),
    })
  } catch {
    return NextResponse.json({ error: 'Error al obtener posiciones' }, { status: 500 })
  }
}
