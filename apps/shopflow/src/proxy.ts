import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Session lives on the API host (httpOnly). Server-side middleware cannot read it.
 * Dashboard auth is enforced client-side (see DashboardSessionGate).
 */
export function proxy(_request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
