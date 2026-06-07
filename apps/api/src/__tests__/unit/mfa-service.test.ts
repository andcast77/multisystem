import { describe, it, expect, beforeAll } from 'vitest'
import { generateSync, verifySync } from 'otplib'
import {
  generateTotpRawSecret,
  verifyTotp,
  normalizeBackupCodeInput,
  generatePlainBackupCodes,
  MFA_BACKUP_CODE_COUNT,
} from '../../services/mfa.service.js'

beforeAll(() => {
  process.env.FIELD_ENCRYPTION_KEY = ''
})

describe('mfa.service TOTP', () => {
  it('verifyTotp accepts current code from same secret', () => {
    const secret = generateTotpRawSecret()
    const token = generateSync({ secret })
    expect(verifyTotp(secret, token)).toBe(true)
  })

  it('verifyTotp matches otplib verifySync with epochTolerance', () => {
    const secret = generateTotpRawSecret()
    const token = generateSync({ secret })
    const r = verifySync({ secret, token, epochTolerance: 30 })
    expect(r.valid).toBe(true)
    expect(verifyTotp(secret, token)).toBe(true)
  })
})

describe('mfa.service backup codes', () => {
  it('normalizeBackupCodeInput strips dashes and spaces', () => {
    expect(normalizeBackupCodeInput('ab12-cd34-ef56')).toBe('AB12CD34EF56')
  })

  it('generatePlainBackupCodes returns expected count', () => {
    const codes = generatePlainBackupCodes(MFA_BACKUP_CODE_COUNT)
    expect(codes).toHaveLength(MFA_BACKUP_CODE_COUNT)
    expect(codes[0]).toMatch(/^[2-9A-Z]{4}-[2-9A-Z]{4}-[2-9A-Z]{4}$/)
  })
})
