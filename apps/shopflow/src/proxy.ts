import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth-token'

/** Decode token from cookie (login sets it with encodeURIComponent). */
function getTokenFromCookie(request: NextRequest): string | null {
  const raw = request.cookies.get('token')?.value
  if (!raw) return null
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}

export function proxy(request: NextRequest) {
  const token = getTokenFromCookie(request)

  // Public routes that don't require authentication (defined but not used yet)
  // const publicRoutes = ['/login', '/api/auth/login']
  // const isPublicRoute = publicRoutes.some((route) =>
  //   request.nextUrl.pathname.startsWith(route)
  // )

  // API routes
  if (request.nextUrl.pathname.startsWith('/api')) {
    // Auth API routes are public
    if (request.nextUrl.pathname.startsWith('/api/auth')) {
      return NextResponse.next()
    }

    // Temporary: Allow superadmin creation endpoint (remove after use)
    if (request.nextUrl.pathname.startsWith('/api/admin/create-superadmin')) {
      return NextResponse.next()
    }

    // Protected API routes
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Add user info to request headers for API routes
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', decoded.id)
    requestHeaders.set('x-user-role', decoded.role)

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  // Dashboard routes (protected)
  // Protect both /dashboard and routes in (dashboard) route group
  const dashboardRoutes = [
    '/dashboard',
    '/pos',
    '/products',
    '/customers',
    '/suppliers',
    '/inventory',
    '/categories',
    '/reports',
    '/admin',
  ]
  const isDashboardRoute = dashboardRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  )

  if (isDashboardRoute) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}

