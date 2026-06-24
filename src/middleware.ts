import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value
  if (token) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-auth-token', token)
    return NextResponse.next({ request: { headers: requestHeaders } })
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
