/** Canonical prefix for version 1 HTTP routes. */
export const API_V1_PREFIX = '/v1' as const

/** `v1p('/auth/login')` → `/v1/auth/login` */
export function v1p(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`
  return `${API_V1_PREFIX}${p}`
}
