import type { FastifyReply } from 'fastify'
import type { AppConfig } from './config.js'

/** HttpOnly session cookie on the API host (Plan A / ADR-auth-token-storage). */
export const AUTH_SESSION_COOKIE = 'ms_session'

/**
 * Parse JWT expiry like 7d, 24h, 3600 (seconds if plain number).
 */
export function jwtExpiresInToMaxAgeSeconds(expiresIn: string): number {
  const s = expiresIn.trim()
  const m = s.match(/^(\d+)\s*([dhms])?$/i)
  if (!m) {
    const n = parseInt(s, 10)
    return Number.isFinite(n) && n > 0 ? n : 7 * 24 * 60 * 60
  }
  const num = parseInt(m[1], 10)
  const u = (m[2] || 's').toLowerCase()
  if (u === 'd') return num * 24 * 60 * 60
  if (u === 'h') return num * 60 * 60
  if (u === 'm') return num * 60
  return num
}

export function attachAuthSessionCookie(reply: FastifyReply, token: string, config: AppConfig): void {
  const maxAge = jwtExpiresInToMaxAgeSeconds(config.JWT_EXPIRES_IN)
  // Cross-origin SPAs (separate app vs API port/origin) require SameSite=None + Secure.
  // Browsers allow Secure cookies on http://localhost for local dev.
  const insecureDev =
    process.env.AUTH_SESSION_INSECURE === '1' && config.NODE_ENV !== 'production' && !process.env.VERCEL
  const segments = [
    `${AUTH_SESSION_COOKIE}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    `Max-Age=${maxAge}`,
    insecureDev ? 'SameSite=Lax' : 'SameSite=None',
  ]
  if (!insecureDev) segments.push('Secure')
  reply.header('Set-Cookie', segments.join('; '))
}

/** Clear httpOnly session on the API host. */
export function clearAuthSessionCookie(reply: FastifyReply, config: AppConfig): void {
  const insecureDev =
    process.env.AUTH_SESSION_INSECURE === '1' && config.NODE_ENV !== 'production' && !process.env.VERCEL
  const base = ['Path=/', 'HttpOnly', 'Max-Age=0', insecureDev ? 'SameSite=Lax' : 'SameSite=None']
  if (!insecureDev) base.push('Secure')
  reply.header('Set-Cookie', `${AUTH_SESSION_COOKIE}=; ${base.join('; ')}`)
}
