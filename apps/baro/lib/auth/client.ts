/**
 * Edge-safe auth helpers for Baro proxy.
 * Session JWT lives in httpOnly `ms_session` on the API host (ADR-auth-token-storage) —
 * not readable from the Baro origin in middleware/proxy.
 */

export function isAuthEnabled(): boolean {
  return process.env.AUTH_ENABLED === 'true'
}
