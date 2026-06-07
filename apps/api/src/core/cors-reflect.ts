import type { ServerResponse } from 'http'

/**
 * Mirrors @fastify/cors behavior for hijacked/raw responses: reflect allowed Origin
 * and set Access-Control-Allow-Credentials (required for credentialed browser requests).
 */
export function parseCorsOriginList(corsOrigin: string): string[] {
  return corsOrigin
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)
}

export function reflectAllowedOrigin(
  originHeader: string | undefined,
  allowedOrigins: string[],
): string | null {
  if (!originHeader) return null
  return allowedOrigins.includes(originHeader) ? originHeader : null
}

export function applyCorsHeadersToRawResponse(
  raw: ServerResponse,
  originHeader: string | undefined,
  allowedOrigins: string[],
): void {
  const origin = reflectAllowedOrigin(originHeader, allowedOrigins)
  if (!origin) return
  raw.setHeader('Access-Control-Allow-Origin', origin)
  raw.setHeader('Access-Control-Allow-Credentials', 'true')
  raw.setHeader('Vary', 'Origin')
}
