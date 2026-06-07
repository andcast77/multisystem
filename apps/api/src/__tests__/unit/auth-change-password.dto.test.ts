import { describe, expect, it } from 'vitest'
import { changePasswordBodySchema } from '../../dto/auth.dto.js'

describe('changePasswordBodySchema', () => {
  it('accepts matching new and confirm passwords', () => {
    const parsed = changePasswordBodySchema.safeParse({
      currentPassword: 'old-secret',
      newPassword: 'new-secret',
      confirmPassword: 'new-secret',
    })
    expect(parsed.success).toBe(true)
  })

  it('rejects mismatched confirm password', () => {
    const parsed = changePasswordBodySchema.safeParse({
      currentPassword: 'old-secret',
      newPassword: 'new-secret',
      confirmPassword: 'other-secret',
    })
    expect(parsed.success).toBe(false)
  })

  it('requires at least 8 chars for new password', () => {
    const parsed = changePasswordBodySchema.safeParse({
      currentPassword: 'old-secret',
      newPassword: 'short',
      confirmPassword: 'short',
    })
    expect(parsed.success).toBe(false)
  })
})
