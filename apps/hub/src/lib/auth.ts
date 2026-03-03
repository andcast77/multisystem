/**
 * Token utilities for Hub authentication.
 * Client-side only (uses document.cookie).
 */

const TOKEN_COOKIE = "token";
const MAX_AGE_DAYS = 7;

/** Read token from cookie (client-side). */
export function getTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`${TOKEN_COOKIE}=([^;]+)`));
  if (!match) return null;
  try {
    return decodeURIComponent(match[1].trim());
  } catch {
    return null;
  }
}

/** Set token in cookie (client-side). */
export function setTokenCookie(token: string): void {
  if (typeof document === "undefined") return;
  const maxAge = 60 * 60 * 24 * MAX_AGE_DAYS;
  document.cookie = `${TOKEN_COOKIE}=${encodeURIComponent(token)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

/** Clear token cookie (client-side). */
export function clearTokenCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${TOKEN_COOKIE}=; path=/; max-age=0`;
}
