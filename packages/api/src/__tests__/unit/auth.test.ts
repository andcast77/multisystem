import jwt from 'jsonwebtoken'
import { describe, it, expect, beforeAll } from 'vitest'
import {
  generateToken,
  verifyToken,
  userDisplayName,
  generateMfaPendingToken,
  verifyMfaPendingToken,
  type TokenPayload,
} from '../../core/auth.js'

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret-key-for-unit-tests-only'
  process.env.JWT_EXPIRES_IN = '1h'
  process.env.JWT_ACCESS_EXPIRES_IN = '1h'
})

const samplePayload: TokenPayload = {
  id: 'user-123',
  email: 'test@example.com',
  role: 'USER',
  isSuperuser: false,
}

describe('generateToken / verifyToken round-trip', () => {
  it('produces a valid JWT that verifies back to the original payload', () => {
    const token = generateToken(samplePayload)
    expect(typeof token).toBe('string')
    expect(token.split('.')).toHaveLength(3)

    const decoded = verifyToken(token)
    expect(decoded).not.toBeNull()
    expect(decoded!.id).toBe(samplePayload.id)
    expect(decoded!.email).toBe(samplePayload.email)
    expect(decoded!.role).toBe(samplePayload.role)
    expect(decoded!.isSuperuser).toBe(false)
    expect(decoded!.jti).toBeTruthy()
    expect(typeof decoded!.jti).toBe('string')
  })

  it('preserves optional companyId and membershipRole', () => {
    const payload: TokenPayload = {
      ...samplePayload,
      companyId: 'company-456',
      membershipRole: 'ADMIN',
    }
    const token = generateToken(payload)
    const decoded = verifyToken(token)

    expect(decoded!.companyId).toBe('company-456')
    expect(decoded!.membershipRole).toBe('ADMIN')
  })

  it('JWT payload includes iat and exp claims', () => {
    const token = generateToken(samplePayload)
    const decoded = jwt.decode(token) as { iat?: number; exp?: number } | null
    expect(decoded?.iat).toBeTypeOf('number')
    expect(decoded?.exp).toBeTypeOf('number')
    expect(decoded!.exp!).toBeGreaterThan(decoded!.iat!)
  })

  it('rejects MFA pending tokens from verifyToken', () => {
    const pending = generateMfaPendingToken(samplePayload.id)
    expect(verifyToken(pending)).toBeNull()
    expect(verifyMfaPendingToken(pending)?.userId).toBe(samplePayload.id)
  })
})

describe('verifyToken with invalid tokens', () => {
  it('returns null for empty string', () => {
    expect(verifyToken('')).toBeNull()
  })

  it('returns null for random garbage', () => {
    expect(verifyToken('not.a.jwt')).toBeNull()
  })

  it('returns null for a token signed with a different secret', () => {
    const token = generateToken(samplePayload)
    const originalSecret = process.env.JWT_SECRET
    process.env.JWT_SECRET = 'different-secret'
    expect(verifyToken(token)).toBeNull()
    process.env.JWT_SECRET = originalSecret
  })

  it('returns null for a tampered payload', () => {
    const token = generateToken(samplePayload)
    const [header, , signature] = token.split('.')
    const tamperedPayload = btoa(JSON.stringify({ ...samplePayload, id: 'hacker-999' }))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
    const tampered = `${header}.${tamperedPayload}.${signature}`
    expect(verifyToken(tampered)).toBeNull()
  })
})

describe('userDisplayName', () => {
  it('returns "firstName lastName" when both are present', () => {
    expect(userDisplayName({ firstName: 'John', lastName: 'Doe', email: 'j@d.com' })).toBe('John Doe')
  })

  it('falls back to email when firstName and lastName are empty strings', () => {
    expect(userDisplayName({ firstName: '', lastName: '', email: 'j@d.com' })).toBe('j@d.com')
  })

  it('falls back to email when firstName and lastName are undefined', () => {
    expect(userDisplayName({ email: 'j@d.com' })).toBe('j@d.com')
  })

  it('trims outer whitespace but preserves internal gaps', () => {
    const result = userDisplayName({ firstName: '  Ana  ', lastName: '  López  ', email: 'a@l.com' })
    expect(result).toBe('Ana     López')
    expect(result.startsWith(' ')).toBe(false)
    expect(result.endsWith(' ')).toBe(false)
  })

  it('handles only firstName present', () => {
    expect(userDisplayName({ firstName: 'Solo', lastName: '', email: 'x@y.com' })).toBe('Solo')
  })
})
