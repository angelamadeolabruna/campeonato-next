import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromToken, unauthorized } from '@/lib/auth'

export async function POST(request: NextRequest) {
  if (!getUserIdFromToken(request)) return unauthorized()

  try {
    const maxJornada = await prisma.jornada.findFirst({ orderBy: { numero: 'desc' } })
    const desde = maxJornada ? maxJornada.numero + 1 : 1
    const categories = await prisma.category.findMany({ orderBy: { id: 'asc' } })

    for (const cat of categories) {
      const teams = await prisma.team.findMany({ where: { categoriaId: cat.id }, orderBy: { id: 'asc' } })
      if (teams.length < 2) continue

      const teamIds = teams.map(t => t.id)

      // All existing ordered pairs (localId-visitanteId)
      const existingMatches = await prisma.match.findMany({
        where: { categoriaId: cat.id },
        select: { localId: true, visitanteId: true }
      })

      const existingOrderedPairs = new Set<string>()
      for (const m of existingMatches) {
        existingOrderedPairs.add(`${m.localId}-${m.visitanteId}`)
      }

      // Track which unordered pairs have played and in what direction
      const pairPlayed = new Map<string, { localId: number; visitanteId: number }>()
      for (const m of existingMatches) {
        const min = Math.min(m.localId, m.visitanteId)
        const max = Math.max(m.localId, m.visitanteId)
        const key = `${min}-${max}`
        if (!pairPlayed.has(key)) {
          pairPlayed.set(key, { localId: m.localId, visitanteId: m.visitanteId })
        }
      }

      // Separate pending into first round (ida) and second round (vuelta)
      const firstRoundPending: [number, number][] = []
      const secondRoundPending: [number, number][] = []

      for (let i = 0; i < teamIds.length; i++) {
        for (let j = i + 1; j < teamIds.length; j++) {
          const key = `${teamIds[i]}-${teamIds[j]}`
          const status = pairPlayed.get(key)

          if (!status) {
            // First round match not yet played: smaller id as local
            firstRoundPending.push([teamIds[i], teamIds[j]])
          } else {
            // Check if the return match already exists
            const reverseKey = `${status.visitanteId}-${status.localId}`
            if (!existingOrderedPairs.has(reverseKey)) {
              secondRoundPending.push([status.visitanteId, status.localId])
            }
          }
        }
      }

      // Greedy scheduling helper
      const scheduleRounds = (pairs: [number, number][], label: string): [number, number][][] => {
        const rounds: [number, number][][] = []
        let remaining = [...pairs]
        while (remaining.length > 0) {
          const round: [number, number][] = []
          const usedTeams = new Set<number>()
          const nextRemaining: [number, number][] = []
          for (const match of remaining) {
            if (!usedTeams.has(match[0]) && !usedTeams.has(match[1])) {
              round.push(match)
              usedTeams.add(match[0])
              usedTeams.add(match[1])
            } else {
              nextRemaining.push(match)
            }
          }
          rounds.push(round)
          remaining = nextRemaining
        }
        return rounds
      }

      const firstRounds = scheduleRounds(firstRoundPending, 'Primera Rueda')
      const secondRounds = scheduleRounds(secondRoundPending, 'Segunda Rueda')
      const allNewRounds = [...firstRounds, ...secondRounds]

      let jornadaNum = desde
      for (const round of allNewRounds) {
        let jornada = await prisma.jornada.findUnique({ where: { numero: jornadaNum } })
        if (!jornada) {
          jornada = await prisma.jornada.create({
            data: {
              numero: jornadaNum,
              descripcion: `Jornada ${jornadaNum} (${jornadaNum <= desde + firstRounds.length - 1 ? 'Primera Rueda' : 'Segunda Rueda'})`
            }
          })
        }
        for (const match of round) {
          await prisma.match.create({
            data: {
              jornadaId: jornada.id,
              localId: match[0],
              visitanteId: match[1],
              categoriaId: cat.id
            }
          })
        }
        jornadaNum++
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
    return NextResponse.json(all)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error al generar fixture' }, { status: 500 })
  }
}
