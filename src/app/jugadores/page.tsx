import { redirect } from 'next/navigation'
import { getUserId } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import Layout from '@/components/Layout'
import PlayersContent from '@/components/PlayersContent'

export default async function JugadoresPage() {
  const userId = await getUserId()
  if (!userId) redirect('/login')

  const [players, teams] = await Promise.all([
    prisma.player.findMany({ orderBy: { id: 'asc' }, include: { equipo: { select: { id: true, nombre: true, categoria: { select: { id: true, nombre: true } } } } } }),
    prisma.team.findMany({ orderBy: { id: 'asc' }, include: { categoria: true } }),
  ])

  return <Layout><PlayersContent initialPlayers={players as any} initialTeams={teams as any} /></Layout>
}
