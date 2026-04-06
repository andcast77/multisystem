import { useEffect, useRef, useState } from 'react'

import { getHubWsBaseUrl } from '@/lib/api-origin'

const MAX_RECONNECT_DELAY_MS = 30_000
const MAX_RECONNECT_ATTEMPTS = 10
const WS_SUPPORTED = typeof WebSocket !== 'undefined'

/**
 * Fastify `@fastify/websocket` needs a long-lived Node process. Vercel Serverless cannot upgrade
 * WebSockets for this app pattern — disable unless overridden or API is self-hosted.
 */
function isPresenceWsEnabled(): boolean {
  const explicit = process.env.NEXT_PUBLIC_ENABLE_PRESENCE_WS
  if (typeof explicit === "string" && explicit.trim() !== "") {
    const t = explicit.trim().toLowerCase()
    return t !== "false" && t !== "0" && t !== "no"
  }
  const apiUrl = (process.env.NEXT_PUBLIC_API_URL ?? "").toLowerCase()
  if (apiUrl.includes("vercel.app")) {
    return false
  }
  return true
}

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
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (!companyId || !WS_SUPPORTED || !isPresenceWsEnabled()) return

    let cancelled = false

    function connect() {
      if (cancelled) return

      const url = `${getHubWsBaseUrl()}/v1/ws/presence/${companyId}`
      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => {
        attemptsRef.current = 0
        setConnected(true)
      }

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string) as { event: string; data: unknown }
          if (msg.event === 'presence:sync') {
            const d = msg.data as { users: PresenceUser[] }
            setPresenceList(d.users ?? [])
          } else if (msg.event === 'user:joined') {
            const d = msg.data as PresenceUser
            setPresenceList((prev) => {
              if (prev.some((u) => u.userId === d.userId)) return prev
              return [...prev, { userId: d.userId, name: d.name, connectedAt: d.connectedAt ?? new Date().toISOString() }]
            })
          } else if (msg.event === 'user:left') {
            const d = msg.data as { userId: string }
            setPresenceList((prev) => prev.filter((u) => u.userId !== d.userId))
          }
        } catch {
          // ignore malformed messages
        }
      }

      ws.onclose = () => {
        wsRef.current = null
        setConnected(false)
        setPresenceList([])

        if (cancelled) return
        if (attemptsRef.current >= MAX_RECONNECT_ATTEMPTS) return

        const jitter = Math.random() * 500
        const delay = Math.min(1_000 * 2 ** attemptsRef.current + jitter, MAX_RECONNECT_DELAY_MS)
        attemptsRef.current += 1
        timerRef.current = setTimeout(connect, delay)
      }

      ws.onerror = () => {
        ws.close()
      }
    }

    // Defer opening the socket so React Strict Mode's first mount/unmount cycle
    // clears this timer before `new WebSocket` runs — avoids closing a CONNECTING
    // socket in cleanup (browser: "closed before the connection is established").
    const scheduleConnectId = window.setTimeout(() => {
      if (!cancelled) connect()
    }, 0)

    return () => {
      cancelled = true
      window.clearTimeout(scheduleConnectId)
      if (timerRef.current) clearTimeout(timerRef.current)
      wsRef.current?.close()
      wsRef.current = null
      setConnected(false)
      setPresenceList([])
    }
  }, [companyId])

  return { presenceList, connected }
}
