import { describe, it, expect } from 'vitest'
import { toNumber, toNumberOrNull } from '../../common/database/decimal.js'

describe('toNumber', () => {
  it('converts null to 0', () => {
    expect(toNumber(null)).toBe(0)
  })

  it('converts undefined to 0', () => {
    expect(toNumber(undefined)).toBe(0)
  })

  it('passes through numbers', () => {
    expect(toNumber(42)).toBe(42)
    expect(toNumber(3.14)).toBe(3.14)
  })

  it('converts Prisma Decimal-like objects', () => {
    const decimal = { toNumber: () => 99.95 }
    expect(toNumber(decimal)).toBe(99.95)
  })

  it('converts string numbers via Number()', () => {
    expect(toNumber('100')).toBe(100)
    expect(toNumber('0.5')).toBe(0.5)
  })
})

describe('toNumberOrNull', () => {
  it('returns null for null/undefined', () => {
    expect(toNumberOrNull(null)).toBeNull()
    expect(toNumberOrNull(undefined)).toBeNull()
  })

  it('returns number for valid values', () => {
    expect(toNumberOrNull(42)).toBe(42)
    expect(toNumberOrNull({ toNumber: () => 10.5 })).toBe(10.5)
  })
})
