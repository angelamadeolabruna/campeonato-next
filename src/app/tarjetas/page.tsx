import { redirect } from 'next/navigation'
import { getUserId } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import Layout from '@/components/Layout'
import CardsContent from '@/components/CardsContent'

export default async function TarjetasPage() {
  const userId = await getUserId()
  if (!userId) redirect('/login')

  const cards = await prisma.card.findMany({
    orderBy: { creadoEn: 'desc' },
    include: {
      jugador: { select: { id: true, nombre: true, equipo: { select: { nombre: true } } } },
      match: { select: { id: true, jornada: { select: { numero: true } } } },
    },
  })

  return <Layout><CardsContent initialData={cards as any} /></Layout>
}
