/**
 * Auth session lives in httpOnly `ms_session` on the API host (see docs/ADR-auth-token-storage.md).
 * Use `credentials: 'include'` on API fetches. These helpers only clear legacy JS-readable cookies.
 */

const LEGACY_TOKEN_COOKIE = 'token'

function isSecureContext(): boolean {
  if (typeof window === 'undefined') return false
  return window.location.protocol === 'https:'
}

/** @deprecated Session is API httpOnly cookie; do not read JWT from document.cookie. */
export function getTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`${LEGACY_TOKEN_COOKIE}=([^;]+)`))
  if (!match) return null
  try {
    return decodeURIComponent(match[1].trim())
  } catch {
    return null
  }
}

/** @deprecated No-op; API sets httpOnly session on login. */
export function setTokenCookie(_token: string, _maxAgeDays?: number): void {}

/** Clears legacy readable cookie on the app origin after logout / migration. */
export function clearTokenCookie(): void {
  if (typeof document === 'undefined') return
  const secure = isSecureContext() ? '; Secure' : ''
  document.cookie = `${LEGACY_TOKEN_COOKIE}=; path=/; max-age=0; SameSite=Strict${secure}`
}

/** Whether the browser likely has an API session (httpOnly cookie is not readable). */
export async function hasApiSession(apiBaseUrl: string): Promise<boolean> {
  try {
    const res = await fetch(`${apiBaseUrl.replace(/\/$/, '')}/v1/auth/me`, {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    })
    return res.ok
  } catch {
    return false
  }
}
