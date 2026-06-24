import { redirect } from 'next/navigation'
import { getUserId } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import Layout from '@/components/Layout'
import TeamsContent from '@/components/TeamsContent'

export default async function EquiposPage() {
  const userId = await getUserId()
  if (!userId) redirect('/login')

  const [teams, categories] = await Promise.all([
    prisma.team.findMany({ orderBy: { id: 'asc' }, include: { categoria: true, local: true, visitante: true } }),
    prisma.category.findMany({ orderBy: { id: 'asc' } }),
  ])

  return <Layout><TeamsContent initialTeams={teams as any} initialCategories={categories as any} /></Layout>
}
