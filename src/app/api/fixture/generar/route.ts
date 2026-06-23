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

      // Obtener todos los partidos existentes en esta categoría para evitar duplicados en la primera rueda
      const existingMatches = await prisma.match.findMany({
        where: { categoriaId: cat.id },
        select: { localId: true, visitanteId: true }
      })

      // Crear un conjunto de las parejas que ya han jugado
      const playedPairs = new Set<string>()
      for (const m of existingMatches) {
        const min = Math.min(m.localId, m.visitanteId)
        const max = Math.max(m.localId, m.visitanteId)
        playedPairs.add(`${min}-${max}`)
      }

      // Encontrar todas las parejas que aún no se han enfrentado
      const pendingMatches: [number, number][] = []
      for (let i = 0; i < teamIds.length; i++) {
        for (let j = i + 1; j < teamIds.length; j++) {
          const min = Math.min(teamIds[i], teamIds[j])
          const max = Math.max(teamIds[i], teamIds[j])
          if (!playedPairs.has(`${min}-${max}`)) {
            // Alternar de local/visitante aleatoriamente o usar el orden
            pendingMatches.push([teamIds[i], teamIds[j]])
          }
        }
      }

      if (pendingMatches.length === 0) continue // Todos los equipos ya jugaron contra todos en esta rueda

      // Programar de forma voraz (greedy) los partidos pendientes en rondas
      const newRounds: [number, number][][] = []
      let remaining = [...pendingMatches]

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

        newRounds.push(round)
        remaining = nextRemaining
      }

      // Guardar las nuevas jornadas y partidos en la base de datos
      for (let r = 0; r < newRounds.length; r++) {
        const jornadaNum = desde + r
        let jornada = await prisma.jornada.findUnique({ where: { numero: jornadaNum } })
        
        if (!jornada) {
          jornada = await prisma.jornada.create({ 
            data: { 
              numero: jornadaNum, 
              descripcion: `Jornada ${jornadaNum} (Primera Rueda)` 
            } 
          })
        }

        for (const match of newRounds[r]) {
          await prisma.match.create({ 
            data: { 
              jornadaId: jornada.id, 
              localId: match[0], 
              visitanteId: match[1], 
              categoriaId: cat.id 
            } 
          })
        }
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
