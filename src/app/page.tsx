import { redirect } from 'next/navigation'
import { getUserId } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import Layout from '@/components/Layout'
import Dashboard from '@/components/Dashboard'

export default async function Home() {
  const userId = await getUserId()
  if (!userId) redirect('/login')

  const [dashboardData, categories] = await Promise.all([
    (async () => {
      const matchWhere: any = {}
      const [equiposDamas, equiposVarones] = await Promise.all([
        prisma.team.count({ where: { categoria: { nombre: 'Damas' } } }),
        prisma.team.count({ where: { categoria: { nombre: 'Varones' } } }),
      ])
      const [jugadoresDamas, jugadoresVarones] = await Promise.all([
        prisma.player.count({ where: { equipo: { categoria: { nombre: 'Damas' } } } }),
        prisma.player.count({ where: { equipo: { categoria: { nombre: 'Varones' } } } }),
      ])
      const [partidosJugados, partidosPendientes] = await Promise.all([
        prisma.match.count({ where: { jugado: true } }),
        prisma.match.count({ where: { jugado: false } }),
      ])
      const [golesDamas, golesVarones] = await Promise.all([
        prisma.goal.count({ where: { match: { categoria: { nombre: 'Damas' } } } }),
        prisma.goal.count({ where: { match: { categoria: { nombre: 'Varones' } } } }),
      ])
      const [suspendidosDamas, suspendidosVarones] = await Promise.all([
        prisma.player.count({ where: { estado: 'Suspendido', equipo: { categoria: { nombre: 'Damas' } } } }),
        prisma.player.count({ where: { estado: 'Suspendido', equipo: { categoria: { nombre: 'Varones' } } } }),
      ])
      const [multasDamas, multasVarones] = await Promise.all([
        prisma.fine.count({ where: { pagado: false, jugador: { equipo: { categoria: { nombre: 'Damas' } } } } }),
        prisma.fine.count({ where: { pagado: false, jugador: { equipo: { categoria: { nombre: 'Varones' } } } } }),
      ])
      const ultimaJornada = await prisma.jornada.findFirst({ orderBy: { numero: 'desc' } })

      const golesPorFecha = await prisma.jornada.findMany({
        orderBy: { numero: 'asc' },
        include: { partidos: { include: { categoria: true } } },
      })
      const golesFechaData = golesPorFecha.map(j => {
        const d = j.partidos.filter(p => p.categoria.nombre === 'Damas')
        const v = j.partidos.filter(p => p.categoria.nombre === 'Varones')
        return { jornada: j.numero, damas: d.reduce((s, p) => s + p.golesLocal + p.golesVisit, 0), varones: v.reduce((s, p) => s + p.golesLocal + p.golesVisit, 0) }
      })

      const allCards = await prisma.card.findMany({
        include: { jugador: { include: { equipo: { include: { categoria: true } } } } },
      })
      const tarjetas = {
        damas: { amarillas: allCards.filter(c => c.jugador.equipo.categoria.nombre === 'Damas' && c.tipo === 'Amarilla').length, rojas: allCards.filter(c => c.jugador.equipo.categoria.nombre === 'Damas' && c.tipo === 'Roja').length },
        varones: { amarillas: allCards.filter(c => c.jugador.equipo.categoria.nombre === 'Varones' && c.tipo === 'Amarilla').length, rojas: allCards.filter(c => c.jugador.equipo.categoria.nombre === 'Varones' && c.tipo === 'Roja').length },
      }

      const goalsGrouped = await prisma.goal.groupBy({ by: ['jugadorId', 'equipoId'], _sum: { cantidad: true }, orderBy: { _sum: { cantidad: 'desc' } }, take: 20 })
      const playerIds = goalsGrouped.map(g => g.jugadorId)
      const players = playerIds.length > 0 ? await prisma.player.findMany({ where: { id: { in: playerIds } }, include: { equipo: { include: { categoria: true } } } }) : []
      const playerMap = new Map(players.map(p => [p.id, p]))
      const topGoleadores: any[] = []
      for (const g of goalsGrouped) {
        const player = playerMap.get(g.jugadorId)
        if (player) topGoleadores.push({ id: player.id, nombre: player.nombre, equipo: player.equipo.nombre, categoria: player.equipo.categoria.nombre, goles: g._sum.cantidad || 0 })
      }

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
        return { equipo: team.nombre, categoria: team.categoria.nombre, pj, pg, pe, pp, gf, gc, dg: gf - gc, pts: pg * 3 + pe }
      })
      const top3Damas = posiciones.filter(p => p.categoria === 'Damas').sort((a, b) => b.pts - a.pts).slice(0, 3)
      const top3Varones = posiciones.filter(p => p.categoria === 'Varones').sort((a, b) => b.pts - a.pts).slice(0, 3)

      const cardsByTeam = allCards.reduce((acc: any, c) => {
        const tn = c.jugador.equipo.nombre; const cat = c.jugador.equipo.categoria.nombre
        if (!acc[cat]) acc[cat] = {}
        if (!acc[cat][tn]) acc[cat][tn] = 0
        acc[cat][tn]++
        return acc
      }, {})
      const masIndisciplinado: any = {}
      for (const cat of ['Damas', 'Varones']) {
        const ct = cardsByTeam[cat]
        if (ct) {
          const maxTeam = Object.entries(ct).sort((a: any, b: any) => b[1] - a[1])[0]
          masIndisciplinado[cat] = maxTeam ? { equipo: maxTeam[0], total: maxTeam[1] } : null
        } else masIndisciplinado[cat] = null
      }

      const proximo = await prisma.match.findFirst({
        where: { jugado: false },
        orderBy: [{ jornada: { numero: 'asc' } }, { id: 'asc' }],
        include: { jornada: true, local: { select: { nombre: true } }, visitante: { select: { nombre: true } }, categoria: true },
      })

      const jugadores2Amarillas = await prisma.player.findMany({
        where: { amarillas: 2, estado: { not: 'Suspendido' } },
        include: { equipo: { include: { categoria: true } } },
      })
      const jugadoresMultasSinPagar = await prisma.player.findMany({
        where: { multas: { some: { pagado: false } } },
        include: { equipo: { include: { categoria: true } }, multas: { where: { pagado: false } } },
      })
      const partidosSinResultado = await prisma.match.findMany({
        where: { jugado: false, jornada: { fecha: { not: null } } },
        include: { jornada: true, local: { select: { nombre: true } }, visitante: { select: { nombre: true } }, categoria: true },
        orderBy: { jornada: { numero: 'asc' } },
      })
      const proxJornadaConFecha = await prisma.jornada.findFirst({
        where: { fecha: { not: null }, partidos: { some: { jugado: false } } },
        orderBy: { fecha: 'asc' },
      })

      return {
        kpis: { equiposDamas, equiposVarones, jugadoresDamas, jugadoresVarones, partidosJugados, partidosPendientes, golesDamas, golesVarones, suspendidosDamas, suspendidosVarones, multasDamas, multasVarones, jornadaActual: ultimaJornada?.numero || 0 },
        golesPorFecha: golesFechaData, tarjetas,
        topGoleadores: { damas: topGoleadores.filter(g => g.categoria === 'Damas').slice(0, 5), varones: topGoleadores.filter(g => g.categoria === 'Varones').slice(0, 5) },
        tablaPosiciones: { damas: top3Damas, varones: top3Varones },
        masIndisciplinado, proximoPartido: proximo,
        alertas: { jugadores2Amarillas, jugadoresMultasSinPagar, partidosSinResultado, proximaJornada: proxJornadaConFecha },
      }
    })(),
    prisma.category.findMany({ orderBy: { id: 'asc' } }),
  ])

  return <Layout><Dashboard initialData={dashboardData as any} initialCategories={categories} /></Layout>
}
