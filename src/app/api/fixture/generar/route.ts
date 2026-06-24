import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromToken, unauthorized } from '@/lib/auth'

export async function POST(request: NextRequest) {
  if (!getUserIdFromToken(request)) return unauthorized()

  try {
    const { searchParams } = new URL(request.url)
    const rueda = searchParams.get('rueda') || 'primera'

    const maxJornada = await prisma.jornada.findFirst({ orderBy: { numero: 'desc' } })
    const desde = maxJornada ? maxJornada.numero + 1 : 1
    const categories = await prisma.category.findMany({ orderBy: { id: 'asc' } })

    type CatData = {
      catId: number
      pending: [number, number][]
      teamIds: number[]
    }
    let catDataList: CatData[] = []
    let maxRoundsPerRueda = 0

    for (const cat of categories) {
      const teams = await prisma.team.findMany({ where: { categoriaId: cat.id }, orderBy: { id: 'asc' } })
      if (teams.length < 2) continue

      const teamIds = teams.map(t => t.id)
      const n = teamIds.length
      const roundsPerRueda = n % 2 === 0 ? n - 1 : n
      maxRoundsPerRueda = Math.max(maxRoundsPerRueda, roundsPerRueda)

      const existingMatches = await prisma.match.findMany({
        where: { categoriaId: cat.id },
        select: { localId: true, visitanteId: true }
      })

      const existingOrdered = new Set<string>()
      for (const m of existingMatches) {
        existingOrdered.add(`${m.localId}-${m.visitanteId}`)
      }

      let pending: [number, number][]
      if (rueda === 'primera') {
        pending = []
        for (let i = 0; i < n; i++) {
          for (let j = i + 1; j < n; j++) {
            const key = `${Math.min(teamIds[i], teamIds[j])}-${Math.max(teamIds[i], teamIds[j])}`
            const hasIvsJ = existingOrdered.has(`${teamIds[i]}-${teamIds[j]}`)
            const hasJvsI = existingOrdered.has(`${teamIds[j]}-${teamIds[i]}`)
            if (!hasIvsJ && !hasJvsI) {
              pending.push([teamIds[i], teamIds[j]])
            }
          }
        }
      } else {
        const pairPlayed = new Set<string>()
        for (const m of existingMatches) {
          const key = `${Math.min(m.localId, m.visitanteId)}-${Math.max(m.localId, m.visitanteId)}`
          pairPlayed.add(key)
        }
        pending = []
        for (const key of pairPlayed) {
          const [a, b] = key.split('-').map(Number)
          const hasRev = existingOrdered.has(`${b}-${a}`)
          if (!hasRev) {
            const hasFwd = existingOrdered.has(`${a}-${b}`)
            if (hasFwd) {
              pending.push([b, a])
            } else {
              pending.push([a, b])
            }
          }
        }
      }

      if (pending.length > 0) {
        catDataList.push({ catId: cat.id, pending, teamIds })
      }
    }

    if (catDataList.length === 0) {
      return NextResponse.json({ message: rueda === 'primera' ? 'No hay partidos pendientes para la primera rueda' : 'No hay partidos pendientes para la segunda rueda' })
    }

    // Determine how many NEW rounds we need.
    // For each category WITH pending matches, compute how many more rounds it needs
    // to complete the standard round-robin, plus catch-up capacity.
    const existingRounds = desde - 1
    let R = 1
    for (const catData of catDataList) {
      const n = catData.teamIds.length
      const roundsPerRueda = n % 2 === 0 ? n - 1 : n
      // Standard remaining rounds for this category
      const standardRemaining = roundsPerRueda - existingRounds
      if (standardRemaining > R) R = standardRemaining

      // Also ensure R is enough to fit all pending matches (catch-up capacity).
      // For each round, at most floor(n/2) matches can be played simultaneously,
      // but with catch-up a team can play multiple, so this is a lower bound.
      const maxPerRound = Math.max(1, Math.floor(n / 2))
      const needed = Math.ceil(catData.pending.length / maxPerRound)
      if (needed > R) R = needed
    }

    // Cap at maxRoundsPerRueda: never generate more rounds than a full rueda
    if (R > maxRoundsPerRueda) R = maxRoundsPerRueda

    const roundMatches: { catId: number; localId: number; visitanteId: number }[][] = []
    for (let r = 0; r < R; r++) roundMatches.push([])

    // Distribute pending matches across R rounds with greedy catch-up
    for (const catData of catDataList) {
      const { catId, pending } = catData
      if (pending.length === 0) continue

      const teamCount = new Map<number, number>()
      for (const [a, b] of pending) {
        teamCount.set(a, (teamCount.get(a) || 0) + 1)
        teamCount.set(b, (teamCount.get(b) || 0) + 1)
      }

      const teamPerRound = new Array<Map<number, number>>(R)
      for (let r = 0; r < R; r++) teamPerRound[r] = new Map()

      const sorted = [...pending].sort((a, b) => {
        const aTotal = (teamCount.get(a[0]) || 0) + (teamCount.get(a[1]) || 0)
        const bTotal = (teamCount.get(b[0]) || 0) + (teamCount.get(b[1]) || 0)
        return bTotal - aTotal
      })

      for (const [local, visit] of sorted) {
        let bestR = 0
        let bestScore = Infinity
        for (let r = 0; r < R; r++) {
          const t1 = teamPerRound[r].get(local) || 0
          const t2 = teamPerRound[r].get(visit) || 0
          const score = t1 + t2
          if (score < bestScore) {
            bestScore = score
            bestR = r
          }
        }
        teamPerRound[bestR].set(local, (teamPerRound[bestR].get(local) || 0) + 1)
        teamPerRound[bestR].set(visit, (teamPerRound[bestR].get(visit) || 0) + 1)
        roundMatches[bestR].push({ catId, localId: local, visitanteId: visit })
      }
    }

    // Phase 2: ensure EVERY round has at least 1 match per category.
    // For each category, if a round has 0 matches, steal 1 from a donor round that has >= 2.
    for (const catData of catDataList) {
      const { catId } = catData
      for (let r = 0; r < R; r++) {
        const hasCat = roundMatches[r].some(m => m.catId === catId)
        if (hasCat) continue

        // Find a donor round (different from r) with >= 2 matches of this category
        let donorR = -1
        for (let d = 0; d < R; d++) {
          if (d === r) continue
          const catMatches = roundMatches[d].filter(m => m.catId === catId)
          if (catMatches.length >= 2) {
            donorR = d
            break
          }
        }

        if (donorR !== -1) {
          const idx = roundMatches[donorR].findIndex(m => m.catId === catId)
          if (idx !== -1) {
            const moved = roundMatches[donorR].splice(idx, 1)[0]
            roundMatches[r].push(moved)
          }
        }
      }
    }

    // Save to DB. Create ALL R rounds consecutively.
    const createdJornadas: number[] = []
    for (let r = 0; r < R; r++) {
      const matches = roundMatches[r]
      const jornadaNum = desde + r

      let jornada = await prisma.jornada.findUnique({ where: { numero: jornadaNum } })
      if (!jornada) {
        jornada = await prisma.jornada.create({
          data: {
            numero: jornadaNum,
            descripcion: `Jornada ${jornadaNum} (${rueda === 'primera' ? 'Primera' : 'Segunda'} Rueda)`
          }
        })
      }
      createdJornadas.push(jornadaNum)

      for (const m of matches) {
        await prisma.match.create({
          data: { jornadaId: jornada.id, localId: m.localId, visitanteId: m.visitanteId, categoriaId: m.catId }
        })
      }
    }

    const all = await prisma.jornada.findMany({
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
    return NextResponse.json({ jornadas: all, createdJornadas, rueda })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error al generar fixture' }, { status: 500 })
  }
}
