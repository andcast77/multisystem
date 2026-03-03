'use client'

import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useUser } from '@/hooks/useUser'
import { authApi } from '@/lib/api/client'

const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 días

function setTokenCookie(token: string) {
  if (typeof document === 'undefined') return
  document.cookie = `token=${encodeURIComponent(token)}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`
}

/**
 * Restores company context when user has preferredCompanyId (from BD) but token has no companyId.
 * Runs once per load; no localStorage — preferred company comes from GET /me.
 * Renders children always so /me and /companies can run in parallel.
 */
export function CompanyContextBootstrap({ children }: { children: React.ReactNode }) {
  const { data: user } = useUser()
  const queryClient = useQueryClient()
  const restoreDone = useRef(false)

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !user ||
      user.companyId ||
      !user.preferredCompanyId ||
      restoreDone.current
    )
      return

    restoreDone.current = true

    authApi
      .post<{
        success?: boolean
        data?: { token: string; companyId?: string; company?: { id: string; name: string; workifyEnabled: boolean; shopflowEnabled: boolean } }
        error?: string
      }>('/context', { companyId: user.preferredCompanyId })
      .then((res) => {
        if (
          res &&
          typeof res === 'object' &&
          'data' in res &&
          res.success &&
          res.data?.token
        ) {
          setTokenCookie(res.data.token)
          const newCompanyId = res.data.companyId ?? user.preferredCompanyId
          const newCompany = res.data.company
          queryClient.setQueryData(['currentUser'], (prev: unknown) => {
            if (prev && typeof prev === 'object' && prev !== null) {
              return { ...prev, companyId: newCompanyId, company: newCompany ?? (prev as { company?: unknown }).company }
            }
            return prev
          })
        }
      })
      .catch(() => {
        restoreDone.current = false
      })
  }, [user, queryClient])

  return <>{children}</>
}
