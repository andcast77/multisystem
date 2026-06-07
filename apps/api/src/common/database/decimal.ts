/**
 * Central Decimal-to-number conversion for Prisma Decimal fields.
 * Eliminates the scattered `num()` helper copies across services.
 */
export function toNumber(v: unknown): number {
  if (v == null) return 0
  if (typeof v === 'number') return v
  if (typeof v === 'object' && v !== null && 'toNumber' in v) {
    return (v as { toNumber: () => number }).toNumber()
  }
  return Number(v)
}

export function toNumberOrNull(v: unknown): number | null {
  if (v == null) return null
  return toNumber(v)
}
