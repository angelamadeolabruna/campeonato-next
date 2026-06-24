import { redirect } from 'next/navigation'
import { getUserId } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import Layout from '@/components/Layout'
import FixtureContent from '@/components/FixtureContent'

export default async function FixturePage() {
  const userId = await getUserId()
  if (!userId) redirect('/login')

  const [fixture, categories, teams] = await Promise.all([
    prisma.jornada.findMany({
      orderBy: { numero: 'asc' },
      include: {
        partidos: {
          include: {
            local: { select: { id: true, nombre: true } },
            visitante: { select: { id: true, nombre: true } },
            categoria: { select: { id: true, nombre: true, color: true } },
            goles: { include: { jugador: { select: { id: true, nombre: true } } } },
            tarjetas: { include: { jugador: { select: { id: true, nombre: true, equipo: { select: { nombre: true } } } } } },
          },
          orderBy: { id: 'asc' },
        },
      },
    }),
    prisma.category.findMany({ orderBy: { id: 'asc' } }),
    prisma.team.findMany({ orderBy: { id: 'asc' }, include: { categoria: { select: { id: true, nombre: true } } } }),
  ])

  return <Layout><FixtureContent initialJornadas={fixture as any} initialCategories={categories as any} initialTeams={teams as any} /></Layout>
}
