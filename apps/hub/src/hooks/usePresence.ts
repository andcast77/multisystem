import { useEffect, useRef, useState } from 'react'

import { getHubApiBaseUrl } from '@/lib/api-origin'

const MAX_RECONNECT_DELAY_MS = 30_000
const MAX_RECONNECT_ATTEMPTS = 10
const SSE_SUPPORTED = typeof EventSource !== 'undefined'

export interface PresenceUser {
  userId: string
  name: string
  connectedAt: string
}

export function usePresence(companyId: string | undefined) {
  const [presenceList, setPresenceList] = useState<PresenceUser[]>([])
  const [connected, setConnected] = useState(false)
  const attemptsRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const esRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (!companyId || !SSE_SUPPORTED) return

    let cancelled = false

    function connect() {
      if (cancelled) return

      const url = `${getHubApiBaseUrl()}/v1/events/presence/${companyId}`
      const es = new EventSource(url, { withCredentials: true })
      esRef.current = es

      es.onopen = () => {
        attemptsRef.current = 0
        setConnected(true)
      }

      es.addEventListener('presence:sync', (ev) => {
        try {
          const raw = (ev as MessageEvent).data as string
          const d = JSON.parse(raw) as { users: PresenceUser[] }
          setPresenceList(d.users ?? [])
        } catch {
          /* ignore */
        }
      })

      es.addEventListener('user:joined', (ev) => {
        try {
          const raw = (ev as MessageEvent).data as string
          const d = JSON.parse(raw) as PresenceUser
          setPresenceList((prev) => {
            if (prev.some((u) => u.userId === d.userId)) return prev
            return [
              ...prev,
              {
                userId: d.userId,
                name: d.name,
                connectedAt: d.connectedAt ?? new Date().toISOString(),
              },
            ]
          })
        } catch {
          /* ignore */
        }
      })

      es.addEventListener('user:left', (ev) => {
        try {
          const raw = (ev as MessageEvent).data as string
          const d = JSON.parse(raw) as { userId: string }
          setPresenceList((prev) => prev.filter((u) => u.userId !== d.userId))
        } catch {
          /* ignore */
        }
      })

      es.onerror = () => {
        es.close()
        esRef.current = null
        setConnected(false)
        setPresenceList([])

        if (cancelled) return
        if (attemptsRef.current >= MAX_RECONNECT_ATTEMPTS) return

        const jitter = Math.random() * 500
        const delay = Math.min(1_000 * 2 ** attemptsRef.current + jitter, MAX_RECONNECT_DELAY_MS)
        attemptsRef.current += 1
        timerRef.current = setTimeout(connect, delay)
      }
    }

    const scheduleConnectId = window.setTimeout(() => {
      if (!cancelled) connect()
    }, 0)

    return () => {
      cancelled = true
      window.clearTimeout(scheduleConnectId)
      if (timerRef.current) clearTimeout(timerRef.current)
      esRef.current?.close()
      esRef.current = null
      setConnected(false)
      setPresenceList([])
    }
  }, [companyId])

  return { presenceList, connected }
}
