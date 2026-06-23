import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromToken, unauthorized } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const userId = getUserIdFromToken(request)
  if (!userId) return unauthorized()

  try {
    const { searchParams } = new URL(request.url)
    const catFilter = searchParams.get('categoria')
    const filterCategoriaId = catFilter && catFilter !== 'todas' ? Number(catFilter) : undefined
    const whereCat = filterCategoriaId ? { id: filterCategoriaId } : {}

    const matchWhere: any = filterCategoriaId ? { categoriaId: filterCategoriaId } : {}

    const [equiposDamas, equiposVarones] = await Promise.all([
      prisma.team.count({ where: { categoria: { nombre: 'Damas', ...whereCat } } }),
      prisma.team.count({ where: { categoria: { nombre: 'Varones', ...whereCat } } }),
    ])
    const [jugadoresDamas, jugadoresVarones] = await Promise.all([
      prisma.player.count({ where: { equipo: { categoria: { nombre: 'Damas', ...whereCat } } } }),
      prisma.player.count({ where: { equipo: { categoria: { nombre: 'Varones', ...whereCat } } } }),
    ])
    const [partidosJugados, partidosPendientes] = await Promise.all([
      prisma.match.count({ where: { ...matchWhere, jugado: true } }),
      prisma.match.count({ where: { ...matchWhere, jugado: false } }),
    ])
    const [golesDamas, golesVarones] = await Promise.all([
      prisma.goal.count({ where: { match: { categoria: { nombre: 'Damas', ...whereCat } } } }),
      prisma.goal.count({ where: { match: { categoria: { nombre: 'Varones', ...whereCat } } } }),
    ])
    const [suspendidosDamas, suspendidosVarones] = await Promise.all([
      prisma.player.count({ where: { estado: 'Suspendido', equipo: { categoria: { nombre: 'Damas', ...whereCat } } } }),
      prisma.player.count({ where: { estado: 'Suspendido', equipo: { categoria: { nombre: 'Varones', ...whereCat } } } }),
    ])

    const multasDWhere: any = { pagado: false, jugador: { equipo: { categoria: { nombre: 'Damas', ...whereCat } } } }
    const multasVWhere: any = { pagado: false, jugador: { equipo: { categoria: { nombre: 'Varones', ...whereCat } } } }
    const [multasDamas, multasVarones] = await Promise.all([
      prisma.fine.count({ where: multasDWhere }),
      prisma.fine.count({ where: multasVWhere }),
    ])

    const ultimaJornada = await prisma.jornada.findFirst({ orderBy: { numero: 'desc' } })

    const golesPorFecha = await prisma.jornada.findMany({
      orderBy: { numero: 'asc' },
      include: { partidos: { include: { categoria: true }, where: matchWhere } },
    })
    const golesFechaData = golesPorFecha.map(j => {
      const d = j.partidos.filter(p => p.categoria.nombre === 'Damas')
      const v = j.partidos.filter(p => p.categoria.nombre === 'Varones')
      return { jornada: j.numero, damas: d.reduce((s, p) => s + p.golesLocal + p.golesVisit, 0), varones: v.reduce((s, p) => s + p.golesLocal + p.golesVisit, 0) }
    })

    const cardsWhere: any = filterCategoriaId ? { jugador: { equipo: { categoriaId: filterCategoriaId } } } : {}
    const allCards = await prisma.card.findMany({
      where: cardsWhere,
      include: { jugador: { include: { equipo: { include: { categoria: true } } } } },
    })
    const tarjetas = {
      damas: { amarillas: allCards.filter(c => c.jugador.equipo.categoria.nombre === 'Damas' && c.tipo === 'Amarilla').length, rojas: allCards.filter(c => c.jugador.equipo.categoria.nombre === 'Damas' && c.tipo === 'Roja').length },
      varones: { amarillas: allCards.filter(c => c.jugador.equipo.categoria.nombre === 'Varones' && c.tipo === 'Amarilla').length, rojas: allCards.filter(c => c.jugador.equipo.categoria.nombre === 'Varones' && c.tipo === 'Roja').length },
    }

    const goalsGrouped = await prisma.goal.groupBy({ by: ['jugadorId', 'equipoId'], _sum: { cantidad: true }, orderBy: { _sum: { cantidad: 'desc' } }, take: 20 })
    const topGoleadores: any[] = []
    for (const g of goalsGrouped) {
      const player = await prisma.player.findUnique({ where: { id: g.jugadorId }, include: { equipo: { include: { categoria: true } } } })
      if (player) topGoleadores.push({ id: player.id, nombre: player.nombre, equipo: player.equipo.nombre, categoria: player.equipo.categoria.nombre, goles: g._sum.cantidad || 0 })
    }

    const teams = await prisma.team.findMany({
      where: filterCategoriaId ? { categoriaId: filterCategoriaId } : {},
      include: { categoria: true, local: true, visitante: true },
    })

    const allMatches = await prisma.match.findMany({ where: { jugado: true, ...matchWhere } })
    const posiciones = teams.map(team => {
      const teamMatches = allMatches.filter(m => m.localId === team.id || m.visitanteId === team.id)
      const pj = teamMatches.length
      const pg = teamMatches.filter(m => (m.localId === team.id && m.golesLocal > m.golesVisit) || (m.visitanteId === team.id && m.golesVisit > m.golesLocal)).length
      const pe = teamMatches.filter(m => m.golesLocal === m.golesVisit).length
      const pp = pj - pg - pe
      const gf = teamMatches.reduce((s, m) => s + (m.localId === team.id ? m.golesLocal : m.golesVisit), 0)
      const gc = teamMatches.reduce((s, m) => s + (m.localId === team.id ? m.golesVisit : m.golesLocal), 0)
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
      where: { jugado: false, ...matchWhere },
      orderBy: [{ jornada: { numero: 'asc' } }, { id: 'asc' }],
      include: { jornada: true, local: { select: { nombre: true } }, visitante: { select: { nombre: true } }, categoria: true },
    })

    const jugadores2Amarillas = await prisma.player.findMany({
      where: { amarillas: 2, estado: { not: 'Suspendido' }, ...(filterCategoriaId ? { equipo: { categoriaId: filterCategoriaId } } : {}) },
      include: { equipo: { include: { categoria: true } } },
    })
    const jugadoresMultasSinPagar = await prisma.player.findMany({
      where: { multas: { some: { pagado: false } }, ...(filterCategoriaId ? { equipo: { categoriaId: filterCategoriaId } } : {}) },
      include: { equipo: { include: { categoria: true } }, multas: { where: { pagado: false } } },
    })
    const partidosSinResultado = await prisma.match.findMany({
      where: { jugado: false, jornada: { fecha: { not: null } }, ...matchWhere },
      include: { jornada: true, local: { select: { nombre: true } }, visitante: { select: { nombre: true } }, categoria: true },
      orderBy: { jornada: { numero: 'asc' } },
    })
    const proxJornadaConFecha = await prisma.jornada.findFirst({
      where: { fecha: { not: null }, partidos: { some: { jugado: false } } },
      orderBy: { fecha: 'asc' },
    })

    return NextResponse.json({
      kpis: { equiposDamas, equiposVarones, jugadoresDamas, jugadoresVarones, partidosJugados, partidosPendientes, golesDamas, golesVarones, suspendidosDamas, suspendidosVarones, multasDamas, multasVarones, jornadaActual: ultimaJornada?.numero || 0 },
      golesPorFecha: golesFechaData, tarjetas,
      topGoleadores: { damas: topGoleadores.filter(g => g.categoria === 'Damas').slice(0, 5), varones: topGoleadores.filter(g => g.categoria === 'Varones').slice(0, 5) },
      tablaPosiciones: { damas: top3Damas, varones: top3Varones },
      masIndisciplinado, proximoPartido: proximo,
      alertas: { jugadores2Amarillas, jugadoresMultasSinPagar, partidosSinResultado, proximaJornada: proxJornadaConFecha },
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error al obtener dashboard' }, { status: 500 })
  }
}
