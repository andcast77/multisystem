import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const AUTH_SESSION_COOKIE = 'ms_session'
const AUTH_REFRESH_COOKIE = 'ms_refresh'

const publicRoutes = ['/', '/login', '/register']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isPublic = publicRoutes.includes(pathname)

  if (isPublic) {
    return NextResponse.next()
  }

  const hasSession =
    Boolean(request.cookies.get(AUTH_SESSION_COOKIE)?.value) ||
    Boolean(request.cookies.get(AUTH_REFRESH_COOKIE)?.value)

  if (hasSession) {
    return NextResponse.next()
  }

  const login = new URL('/login', request.url)
  login.searchParams.set('from', pathname)
  return NextResponse.redirect(login)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|.*\\.png$).*)'],
}
