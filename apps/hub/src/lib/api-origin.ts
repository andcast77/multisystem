/**
 * Dev default: '' so fetch/EventSource use same origin and Vite proxies `/v1` → API (avoids CORS).
 * Set `VITE_API_URL` to an absolute URL when the API is on another host (e.g. production).
 *
 * In dev, `VITE_API_URL=http://localhost:3000` (legacy .env) is treated like empty so traffic
 * still goes through the Vite proxy on :3001.
 */
const PROD_FALLBACK_API = 'http://localhost:3000'

const LOCAL_API_USE_PROXY = new Set([
  'http://localhost:3000',
  'http://127.0.0.1:3000',
])

export function getHubApiBaseUrl(): string {
  const v = import.meta.env.VITE_API_URL
  if (typeof v === 'string' && v.trim() !== '') {
    const trimmed = v.trim().replace(/\/$/, '')
    if (import.meta.env.DEV && LOCAL_API_USE_PROXY.has(trimmed)) {
      return ''
    }
    return trimmed
  }
  return import.meta.env.DEV ? '' : PROD_FALLBACK_API
}

/** WebSocket base (same host as page when API base is empty + Vite `proxy.ws`). */
export function getHubWsBaseUrl(): string {
  const base = getHubApiBaseUrl()
  if (base === '') {
    if (typeof window === 'undefined') return 'ws://localhost'
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${proto}//${window.location.host}`
  }
  return base.replace(/^http/, 'ws')
}
