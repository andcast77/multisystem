'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { authApi } from '@/lib/api/client'

/**
 * Ensures user has API session before showing dashboard. httpOnly cookie is not visible to middleware.
 */
export function DashboardSessionGate({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        await authApi.get('/me')
        if (!cancelled) setReady(true)
      } catch {
        if (!cancelled) router.replace(`/login?next=${encodeURIComponent(pathname || '/dashboard')}`)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [router, pathname])

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-slate-500 text-sm">
        Verificando sesión…
      </div>
    )
  }
  return <>{children}</>
}
