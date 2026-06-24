import { redirect } from 'next/navigation'
import { getUserId } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import Layout from '@/components/Layout'
import PositionsContent from '@/components/PositionsContent'

export default async function PosicionesPage() {
  const userId = await getUserId()
  if (!userId) redirect('/login')

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

  const damas = posiciones.filter(p => p.categoria === 'Damas').sort((a, b) => b.puntos - a.puntos || (b.dg - a.dg))
  const varones = posiciones.filter(p => p.categoria === 'Varones').sort((a, b) => b.puntos - a.puntos || (b.dg - a.dg))

  const goalsGrouped = await prisma.goal.groupBy({ by: ['jugadorId', 'equipoId'], _sum: { cantidad: true }, orderBy: { _sum: { cantidad: 'desc' } }, take: 20 })
  const playerIds = goalsGrouped.map(g => g.jugadorId)
  const players = playerIds.length > 0 ? await prisma.player.findMany({ where: { id: { in: playerIds } }, include: { equipo: { include: { categoria: true } } } }) : []
  const playerMap = new Map(players.map(p => [p.id, p]))
  const topGoleadores: any[] = []
  for (const g of goalsGrouped) {
    const player = playerMap.get(g.jugadorId)
    if (player) topGoleadores.push({ id: player.id, nombre: player.nombre, equipo: player.equipo.nombre, categoria: player.equipo.categoria.nombre, goles: g._sum.cantidad || 0 })
  }

  return <Layout><PositionsContent
    initialDamas={damas as any}
    initialVarones={varones as any}
    initialTopDamas={topGoleadores.filter(g => g.categoria === 'Damas').slice(0, 5) as any}
    initialTopVarones={topGoleadores.filter(g => g.categoria === 'Varones').slice(0, 5) as any}
  /></Layout>
}
