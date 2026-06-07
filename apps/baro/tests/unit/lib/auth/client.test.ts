import { afterEach, describe, expect, it } from 'vitest'
import { isAuthEnabled } from '@/lib/auth/client'

describe('isAuthEnabled', () => {
  const original = process.env.AUTH_ENABLED

  afterEach(() => {
    if (original === undefined) {
      delete process.env.AUTH_ENABLED
    } else {
      process.env.AUTH_ENABLED = original
    }
  })

  it('returns true only when AUTH_ENABLED is the string "true"', () => {
    process.env.AUTH_ENABLED = 'true'
    expect(isAuthEnabled()).toBe(true)

    process.env.AUTH_ENABLED = 'false'
    expect(isAuthEnabled()).toBe(false)

    delete process.env.AUTH_ENABLED
    expect(isAuthEnabled()).toBe(false)
  })
})
