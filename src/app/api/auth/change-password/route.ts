import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { getUserIdFromToken, unauthorized } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const userId = getUserIdFromToken(request)
  if (!userId) return unauthorized()

  try {
    const { currentPassword, newPassword } = await request.json()
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

    const valid = await bcrypt.compare(currentPassword, user.password)
    if (!valid) return NextResponse.json({ error: 'Contraseña actual incorrecta' }, { status: 400 })

    if (newPassword.length < 6) return NextResponse.json({ error: 'Mínimo 6 caracteres' }, { status: 400 })

    const hashed = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({ where: { id: userId }, data: { password: hashed } })
    return NextResponse.json({ message: 'Contraseña actualizada' })
  } catch {
    return NextResponse.json({ error: 'Error al cambiar contraseña' }, { status: 500 })
  }
}
