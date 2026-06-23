import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromToken, unauthorized } from '@/lib/auth'

export async function POST(request: NextRequest) {
  if (!getUserIdFromToken(request)) return unauthorized()
  try {
    const { jornadaNumero, categoriaId, localId, visitanteId } = await request.json()

    if (!jornadaNumero || !categoriaId || !localId || !visitanteId) {
      return NextResponse.json({ error: 'Faltan campos' }, { status: 400 })
    }

    if (localId === visitanteId) {
      return NextResponse.json({ error: 'Un equipo no puede jugar contra sí mismo' }, { status: 400 })
    }

    // Asegurar que la jornada exista
    let jornada = await prisma.jornada.findUnique({ where: { numero: Number(jornadaNumero) } })
    if (!jornada) {
      jornada = await prisma.jornada.create({
        data: {
          numero: Number(jornadaNumero),
          descripcion: `Jornada ${jornadaNumero}`
        }
      })
    }

    // Validar si el partido ya existe
    const existing = await prisma.match.findFirst({
      where: {
        jornadaId: jornada.id,
        categoriaId: Number(categoriaId),
        OR: [
          { localId: Number(localId), visitanteId: Number(visitanteId) },
          { localId: Number(visitanteId), visitanteId: Number(localId) }
        ]
      }
    })

    if (existing) {
      return NextResponse.json({ error: 'Este partido ya existe en esta jornada' }, { status: 400 })
    }

    const match = await prisma.match.create({
      data: {
        jornadaId: jornada.id,
        categoriaId: Number(categoriaId),
        localId: Number(localId),
        visitanteId: Number(visitanteId),
      }
    })

    return NextResponse.json(match)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error al crear partido' }, { status: 500 })
  }
}
