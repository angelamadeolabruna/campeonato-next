import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    const maxJornada = await prisma.jornada.findFirst({ orderBy: { numero: 'desc' } })
    const desde = maxJornada ? maxJornada.numero + 1 : 1
    const categories = await prisma.category.findMany({ orderBy: { id: 'asc' } })

    console.log('maxJornada', maxJornada?.numero, 'desde', desde)

    for (const cat of categories) {
      console.log('Category:', cat.nombre)
      const teams = await prisma.team.findMany({ where: { categoriaId: cat.id }, orderBy: { id: 'asc' } })
      if (teams.length < 2) continue

      const teamIds = teams.map(t => t.id)
      console.log('Team IDs:', teamIds)

      const existingMatches = await prisma.match.findMany({
        where: { categoriaId: cat.id },
        select: { localId: true, visitanteId: true }
      })

      const playedPairs = new Set<string>()
      for (const m of existingMatches) {
        const min = Math.min(m.localId, m.visitanteId)
        const max = Math.max(m.localId, m.visitanteId)
        playedPairs.add(`${min}-${max}`)
      }
      
      console.log('Played pairs:', playedPairs)

      const pendingMatches: [number, number][] = []
      for (let i = 0; i < teamIds.length; i++) {
        for (let j = i + 1; j < teamIds.length; j++) {
          const min = Math.min(teamIds[i], teamIds[j])
          const max = Math.max(teamIds[i], teamIds[j])
          if (!playedPairs.has(`${min}-${max}`)) {
            pendingMatches.push([teamIds[i], teamIds[j]])
          }
        }
      }

      console.log('Pending matches:', pendingMatches)

      if (pendingMatches.length === 0) continue

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

      console.log('New rounds:', newRounds)
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
