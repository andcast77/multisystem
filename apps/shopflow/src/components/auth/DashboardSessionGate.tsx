'use client'

import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { authApi } from '@/lib/api/client'

/**
 * Ensures user has API session before showing dashboard. httpOnly cookie is not visible to middleware.
 */
export function DashboardSessionGate({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        await authApi.get('/me')
        if (!cancelled) setReady(true)
      } catch {
        if (!cancelled) navigate(`/login?next=${encodeURIComponent(location.pathname || '/dashboard')}`, { replace: true })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [navigate, location.pathname])

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-slate-500 text-sm">
        Verificando sesión…
      </div>
    )
  }
  return <>{children}</>
}
