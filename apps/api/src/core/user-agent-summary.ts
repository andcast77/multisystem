/**
 * Short human-readable label from a raw User-Agent (no extra dependencies).
 */
export function summarizeUserAgent(ua: string | null | undefined): string | null {
  if (ua == null || !ua.trim()) return null
  const u = ua.toLowerCase()
  let browser = 'Navegador'
  if (u.includes('edg/')) browser = 'Edge'
  else if (u.includes('chrome') && !u.includes('edg')) browser = 'Chrome'
  else if (u.includes('firefox')) browser = 'Firefox'
  else if (u.includes('safari') && !u.includes('chrome')) browser = 'Safari'
  const os =
    u.includes('windows') ? 'Windows'
    : u.includes('mac os') || u.includes('macintosh') ? 'macOS'
    : u.includes('android') ? 'Android'
    : u.includes('iphone') || u.includes('ipad') ? 'iOS'
    : u.includes('linux') ? 'Linux'
    : ''
  const mobile = /mobile|android|iphone|ipad|ipod/i.test(ua)
  const parts = [browser, os, mobile ? 'Móvil' : null].filter(Boolean) as string[]
  return parts.join(' · ')
}
