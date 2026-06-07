import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  encryptField,
  decryptField,
  hashForSearch,
  getEncryptionKey,
} from '../../common/crypto/field-encryption.js'

const TEST_KEY_BASE64 = Buffer.alloc(32, 'k').toString('base64')
const TEST_KEY = Buffer.alloc(32, 'k')

describe('getEncryptionKey', () => {
  const original = process.env.FIELD_ENCRYPTION_KEY

  afterEach(() => {
    if (original === undefined) {
      delete process.env.FIELD_ENCRYPTION_KEY
    } else {
      process.env.FIELD_ENCRYPTION_KEY = original
    }
  })

  it('returns a 32-byte Buffer when FIELD_ENCRYPTION_KEY is a valid base64 32-byte value', () => {
    process.env.FIELD_ENCRYPTION_KEY = TEST_KEY_BASE64
    const key = getEncryptionKey()
    expect(Buffer.isBuffer(key)).toBe(true)
    expect(key.length).toBe(32)
  })

  it('throws when FIELD_ENCRYPTION_KEY is not set', () => {
    delete process.env.FIELD_ENCRYPTION_KEY
    expect(() => getEncryptionKey()).toThrow('FIELD_ENCRYPTION_KEY environment variable is not set')
  })

  it('throws when FIELD_ENCRYPTION_KEY is empty string', () => {
    process.env.FIELD_ENCRYPTION_KEY = ''
    expect(() => getEncryptionKey()).toThrow('FIELD_ENCRYPTION_KEY environment variable is not set')
  })

  it('throws when decoded key is not 32 bytes', () => {
    process.env.FIELD_ENCRYPTION_KEY = Buffer.alloc(16).toString('base64')
    expect(() => getEncryptionKey()).toThrow('must be a base64-encoded 32-byte value')
  })
})

describe('encryptField / decryptField', () => {
  it('round-trips a plain string', () => {
    const plaintext = 'ABC-123456'
    const ciphertext = encryptField(plaintext, TEST_KEY)
    expect(decryptField(ciphertext, TEST_KEY)).toBe(plaintext)
  })

  it('round-trips an empty string', () => {
    const plaintext = ''
    const ciphertext = encryptField(plaintext, TEST_KEY)
    expect(decryptField(ciphertext, TEST_KEY)).toBe(plaintext)
  })

  it('round-trips unicode characters', () => {
    const plaintext = 'Ñoño-987 üñícode'
    const ciphertext = encryptField(plaintext, TEST_KEY)
    expect(decryptField(ciphertext, TEST_KEY)).toBe(plaintext)
  })

  it('produces different ciphertexts for the same plaintext (random IV)', () => {
    const plaintext = 'same-value'
    const ct1 = encryptField(plaintext, TEST_KEY)
    const ct2 = encryptField(plaintext, TEST_KEY)
    expect(ct1).not.toBe(ct2)
  })

  it('stored format has exactly 3 colon-separated parts', () => {
    const ct = encryptField('hello', TEST_KEY)
    expect(ct.split(':').length).toBe(3)
  })

  it('throws on malformed stored value (wrong segment count)', () => {
    expect(() => decryptField('notvalid', TEST_KEY)).toThrow('Invalid encrypted field format')
  })

  it('throws when auth tag verification fails (tampered ciphertext)', () => {
    const ct = encryptField('original', TEST_KEY)
    const parts = ct.split(':')
    parts[2] = Buffer.from('tampered').toString('base64')
    expect(() => decryptField(parts.join(':'), TEST_KEY)).toThrow()
  })

  it('throws when decrypting with a different key', () => {
    const otherKey = Buffer.alloc(32, 'x')
    const ct = encryptField('sensitive', TEST_KEY)
    expect(() => decryptField(ct, otherKey)).toThrow()
  })
})

describe('hashForSearch', () => {
  it('returns a hex string of length 64 (SHA-256 output)', () => {
    const h = hashForSearch('12345', TEST_KEY)
    expect(h).toMatch(/^[0-9a-f]{64}$/)
  })

  it('is deterministic — same value produces same hash', () => {
    const h1 = hashForSearch('ABC-001', TEST_KEY)
    const h2 = hashForSearch('ABC-001', TEST_KEY)
    expect(h1).toBe(h2)
  })

  it('normalizes to lowercase before hashing (case-insensitive search)', () => {
    const hLower = hashForSearch('abc-001', TEST_KEY)
    const hUpper = hashForSearch('ABC-001', TEST_KEY)
    expect(hLower).toBe(hUpper)
  })

  it('different values produce different hashes', () => {
    const h1 = hashForSearch('id-001', TEST_KEY)
    const h2 = hashForSearch('id-002', TEST_KEY)
    expect(h1).not.toBe(h2)
  })

  it('different keys produce different hashes for the same value', () => {
    const otherKey = Buffer.alloc(32, 'z')
    const h1 = hashForSearch('same', TEST_KEY)
    const h2 = hashForSearch('same', otherKey)
    expect(h1).not.toBe(h2)
  })
})
