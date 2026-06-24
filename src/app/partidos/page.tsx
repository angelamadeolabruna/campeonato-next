import { redirect } from 'next/navigation'
import { getUserId } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import Layout from '@/components/Layout'
import MatchesContent from '@/components/MatchesContent'

export default async function PartidosPage() {
  const userId = await getUserId()
  if (!userId) redirect('/login')

  const matches = await prisma.match.findMany({
    orderBy: [{ jornada: { numero: 'asc' } }, { id: 'asc' }],
    include: {
      jornada: true,
      local: { select: { id: true, nombre: true } },
      visitante: { select: { id: true, nombre: true } },
      categoria: true,
      goles: { include: { jugador: { select: { id: true, nombre: true } } } },
      tarjetas: { include: { jugador: { select: { id: true, nombre: true, equipo: { select: { nombre: true } } } } } },
    },
  })

  return <Layout><MatchesContent initialMatches={matches as any} /></Layout>
}
