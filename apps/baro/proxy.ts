import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { isAuthEnabled } from '@/lib/auth/client'

/**
 * Session cookies (`ms_session` / `ms_refresh`) are httpOnly on the API host.
 * Protected routes under `(protected)/` rely on AppSessionGate + GET /v1/baro/me.
 */
export function proxy(_request: NextRequest) {
  if (!isAuthEnabled()) {
    return NextResponse.next()
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|.*\\.png$).*)'],
}
