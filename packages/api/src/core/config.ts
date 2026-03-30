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
  JWT_EXPIRES_IN: string
  TRUST_PROXY: string
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

export function getConfig(): AppConfig {
  return {
    PORT: process.env.PORT ?? '3000',
    CORS_ORIGIN:
      process.env.CORS_ORIGIN ??
      'http://localhost:3001,http://localhost:3002,http://localhost:3003,http://localhost:3004',
    DATABASE_URL: process.env.DATABASE_URL ?? '',
    NODE_ENV: process.env.NODE_ENV ?? 'development',
    JWT_SECRET: process.env.JWT_SECRET ?? (process.env.NODE_ENV === 'production' ? '' : 'dev-secret-change-in-production'),
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '7d',
    TRUST_PROXY: process.env.TRUST_PROXY ?? '',
  }
}
