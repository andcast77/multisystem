/**
 * Centralized configuration. Reads from process.env (populated by @fastify/env in server.ts).
 * Use this instead of process.env in core modules (auth, db) for a single source of truth.
 */
export type AppConfig = {
  PORT: string
  CORS_ORIGIN: string
  DATABASE_URL: string
  NODE_ENV: string
  JWT_SECRET: string
  /** @deprecated Prefer JWT_ACCESS_EXPIRES_IN; kept for backward-compatible env. */
  JWT_EXPIRES_IN: string
  /** Short-lived access JWT (e.g. 15m). */
  JWT_ACCESS_EXPIRES_IN: string
  /** Refresh session cookie / DB session row lifetime (e.g. 30d). */
  REFRESH_TOKEN_EXPIRES_IN: string
  MAX_LOGIN_ATTEMPTS: number
  LOCKOUT_DURATION_MINUTES: number
  /** Mínimo de segundos entre escrituras de `Session.lastSeenAt` por sesión (reduce carga DB). Mínimo efectivo 30. */
  SESSION_LAST_SEEN_THROTTLE_SECONDS: number
  TRUST_PROXY: string
  FIELD_ENCRYPTION_KEY: string
  /** Issuer label in authenticator apps (otpauth URI). */
  MFA_TOTP_ISSUER: string
}

/**
 * Parse TRUST_PROXY for Fastify `trustProxy` (reverse proxy / Vercel).
 * @see https://fastify.dev/docs/latest/Reference/Server/#trustproxy
 */
export function parseTrustProxy(raw: string | undefined): boolean | number {
  if (raw == null || raw.trim() === '') return false
  const v = raw.trim().toLowerCase()
  if (v === 'true' || v === '1' || v === 'yes') return true
  if (v === 'false' || v === '0' || v === 'no') return false
  const n = Number.parseInt(v, 10)
  if (!Number.isNaN(n) && n >= 1 && n <= 32) return n
  return false
}

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  const n = parseInt(raw ?? '', 10)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

export function getConfig(): AppConfig {
  const jwtLegacy = process.env.JWT_EXPIRES_IN ?? '7d'
  return {
    PORT: process.env.PORT ?? '3000',
    CORS_ORIGIN:
      process.env.CORS_ORIGIN ??
      'http://localhost:3001,http://localhost:3002,http://localhost:3003,http://localhost:3004',
    DATABASE_URL: process.env.DATABASE_URL ?? '',
    NODE_ENV: process.env.NODE_ENV ?? 'development',
    JWT_SECRET: process.env.JWT_SECRET ?? (process.env.NODE_ENV === 'production' ? '' : 'dev-secret-change-in-production'),
    JWT_EXPIRES_IN: jwtLegacy,
    JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN?.trim() || '15m',
    REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN?.trim() || '30d',
    MAX_LOGIN_ATTEMPTS: parsePositiveInt(process.env.MAX_LOGIN_ATTEMPTS, 5),
    LOCKOUT_DURATION_MINUTES: parsePositiveInt(process.env.LOCKOUT_DURATION_MINUTES, 15),
    SESSION_LAST_SEEN_THROTTLE_SECONDS: Math.max(
      30,
      parsePositiveInt(process.env.SESSION_LAST_SEEN_THROTTLE_SECONDS, 300),
    ),
    TRUST_PROXY: process.env.TRUST_PROXY ?? '',
    FIELD_ENCRYPTION_KEY: process.env.FIELD_ENCRYPTION_KEY ?? '',
    MFA_TOTP_ISSUER: process.env.MFA_TOTP_ISSUER ?? 'Multisystem',
  }
}
