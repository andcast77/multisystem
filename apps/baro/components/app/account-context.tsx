'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { authApi, baroApi } from '@/lib/api/client'
import type { ApiResponse, MeResponse } from '@multisystem/contracts'
import type { BaroMeResponse } from '@multisystem/contracts'

export type AccountProfileSummary = {
  displayName: string
  professionalTitle: 'AGRIMENSOR' | 'INGENIERO_AGRIMENSOR'
  titleGrammarGender: 'MASCULINO' | 'FEMENINO'
  titularProfessionalId: string
} | null

export type AccountUser = {
  id: string
  email: string
  emailVerified: string | null
}

export type AccountRefreshOptions = {
  silent?: boolean
}

type AccountContextValue = {
  user: AccountUser | null
  profile: AccountProfileSummary
  loading: boolean
  error: string | null
  lastMeStatus: number | null
  refresh: (options?: AccountRefreshOptions) => Promise<void>
}

const AccountContext = createContext<AccountContextValue | null>(null)

const SILENT_REFRESH_INTERVAL_MS = Math.floor(30 * 60 * 1000 * 0.35)

async function fetchMePair(): Promise<{
  authMe: MeResponse | null
  baroMe: BaroMeResponse | null
  status: number
  message?: string
}> {
  try {
    const authRes = await authApi.get<ApiResponse<MeResponse>>('/me')
    if (!authRes.success || !authRes.data) {
      return { authMe: null, baroMe: null, status: 401, message: authRes.message ?? authRes.error }
    }
    let baroMe: BaroMeResponse | null = null
    try {
      const baroRes = await baroApi.get<ApiResponse<BaroMeResponse>>('/me')
      baroMe = baroRes.success ? (baroRes.data ?? null) : null
    } catch {
      baroMe = null
    }
    return { authMe: authRes.data, baroMe, status: 200 }
  } catch (err) {
    const status = (err as { statusCode?: number })?.statusCode ?? null
    return {
      authMe: null,
      baroMe: null,
      status: status ?? 0,
      message: err instanceof Error ? err.message : undefined,
    }
  }
}

export function AccountProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [user, setUser] = useState<AccountUser | null>(null)
  const [profile, setProfile] = useState<AccountProfileSummary>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastMeStatus, setLastMeStatus] = useState<number | null>(null)
  const refreshInFlightRef = useRef<Promise<void> | null>(null)
  const silentRenewInFlightRef = useRef<Promise<boolean> | null>(null)

  const silentRenewAccessCookies = useCallback((): Promise<boolean> => {
    if (silentRenewInFlightRef.current) return silentRenewInFlightRef.current
    const run = (async () => {
      try {
        const r = await authApi.post<ApiResponse<unknown>>('/refresh', {})
        return r.success !== false
      } catch {
        return false
      }
    })().finally(() => {
      silentRenewInFlightRef.current = null
    })
    silentRenewInFlightRef.current = run
    return run
  }, [])

  const refresh = useCallback(async (options?: AccountRefreshOptions) => {
    const silent = options?.silent === true

    if (!silent && refreshInFlightRef.current) {
      return refreshInFlightRef.current
    }

    const run = (async () => {
      setError(null)
      if (!silent) setLoading(true)
      try {
        let result = await fetchMePair()

        if (result.status === 401) {
          const renewed = await silentRenewAccessCookies()
          if (renewed) result = await fetchMePair()
        }

        setLastMeStatus(result.status || null)

        if (!result.authMe) {
          setUser(null)
          setProfile(null)
          if (result.status === 401) {
            setError('Tenés que iniciar sesión de nuevo.')
          } else if (result.status >= 500) {
            setError(result.message ?? 'No pudimos cargar tu cuenta. Probá de nuevo en unos minutos.')
          } else {
            setError(result.message ?? 'No pudimos cargar tu cuenta.')
          }
          return
        }

        setUser({
          id: result.authMe.id,
          email: result.authMe.email,
          emailVerified: null,
        })
        setProfile(result.baroMe?.profile ?? null)
      } catch {
        setUser(null)
        setProfile(null)
        setLastMeStatus(null)
        setError('No pudimos cargar tu cuenta. Comprobá tu conexión.')
      } finally {
        if (!silent) setLoading(false)
      }
    })()

    if (!silent) {
      refreshInFlightRef.current = run
      await run.finally(() => {
        refreshInFlightRef.current = null
      })
    } else {
      await run
    }
  }, [silentRenewAccessCookies])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    if (!user) return
    const tick = () => {
      void silentRenewAccessCookies()
    }
    const id = window.setInterval(tick, SILENT_REFRESH_INTERVAL_MS)
    const onFocus = () => tick()
    const onVis = () => {
      if (document.visibilityState === 'visible') tick()
    }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVis)
    return () => {
      window.clearInterval(id)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [user, silentRenewAccessCookies])

  const value = useMemo(
    () => ({ user, profile, loading, error, lastMeStatus, refresh }),
    [user, profile, loading, error, lastMeStatus, refresh]
  )

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>
}

export function useAccount(): AccountContextValue {
  const ctx = useContext(AccountContext)
  if (!ctx) {
    throw new Error('useAccount debe usarse dentro de AccountProvider')
  }
  return ctx
}
