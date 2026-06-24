import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { generateToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()
    const user = await prisma.user.findUnique({ where: { username } })
    if (!user) return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })

    const token = generateToken(user.id)
    const response = NextResponse.json({ token, user: { id: user.id, username: user.username, nombre: user.nombre } })
    response.cookies.set('token', token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 86400,
      path: '/',
    })
    return response
  } catch {
    return NextResponse.json({ error: 'Error al iniciar sesión' }, { status: 500 })
  }
}
