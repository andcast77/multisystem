/**
 * Shared cookie-based auth utilities for all frontend apps.
 * Eliminates the duplicated auth.ts across hub, shopflow, workify, techservices.
 */

const TOKEN_COOKIE = 'token'
const MAX_AGE_DAYS = 7

function isSecureContext(): boolean {
  if (typeof window === 'undefined') return false
  return window.location.protocol === 'https:'
}

export function getTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`${TOKEN_COOKIE}=([^;]+)`))
  if (!match) return null
  try {
    return decodeURIComponent(match[1].trim())
  } catch {
    return null
  }
}

export function setTokenCookie(token: string, maxAgeDays = MAX_AGE_DAYS): void {
  if (typeof document === 'undefined') return
  const maxAge = 60 * 60 * 24 * maxAgeDays
  const secure = isSecureContext() ? '; Secure' : ''
  document.cookie = `${TOKEN_COOKIE}=${encodeURIComponent(token)}; path=/; max-age=${maxAge}; SameSite=Strict${secure}`
}

export function clearTokenCookie(): void {
  if (typeof document === 'undefined') return
  const secure = isSecureContext() ? '; Secure' : ''
  document.cookie = `${TOKEN_COOKIE}=; path=/; max-age=0; SameSite=Strict${secure}`
}
