import { createCipheriv, createDecipheriv, createHmac, randomBytes } from 'node:crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const TAG_LENGTH = 16
const SEPARATOR = ':'

/**
 * Returns the 32-byte encryption key from FIELD_ENCRYPTION_KEY env var.
 * Expects a base64-encoded 32-byte value.
 * Throws at call-time if the env var is missing or has the wrong length.
 */
export function getEncryptionKey(): Buffer {
  const raw = process.env.FIELD_ENCRYPTION_KEY
  if (!raw || raw.trim() === '') {
    throw new Error('FIELD_ENCRYPTION_KEY environment variable is not set.')
  }
  const buf = Buffer.from(raw.trim(), 'base64')
  if (buf.length !== 32) {
    throw new Error(
      `FIELD_ENCRYPTION_KEY must be a base64-encoded 32-byte value (got ${buf.length} bytes).`
    )
  }
  return buf
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Returns a colon-separated string: base64(iv):base64(authTag):base64(ciphertext)
 */
export function encryptField(value: string, keyBuf: Buffer): string {
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, keyBuf, iv)
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return [
    iv.toString('base64'),
    tag.toString('base64'),
    encrypted.toString('base64'),
  ].join(SEPARATOR)
}

/**
 * Decrypts a value previously encrypted with encryptField.
 * Throws if the stored value is malformed or authentication fails.
 */
export function decryptField(stored: string, keyBuf: Buffer): string {
  const parts = stored.split(SEPARATOR)
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted field format: expected iv:tag:ciphertext')
  }
  const [ivB64, tagB64, ciphertextB64] = parts
  const iv = Buffer.from(ivB64, 'base64')
  const tag = Buffer.from(tagB64, 'base64')
  const ciphertext = Buffer.from(ciphertextB64, 'base64')

  if (iv.length !== IV_LENGTH) {
    throw new Error(`Invalid IV length: expected ${IV_LENGTH}, got ${iv.length}`)
  }
  if (tag.length !== TAG_LENGTH) {
    throw new Error(`Invalid auth tag length: expected ${TAG_LENGTH}, got ${tag.length}`)
  }

  const decipher = createDecipheriv(ALGORITHM, keyBuf, iv)
  decipher.setAuthTag(tag)
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()])
  return decrypted.toString('utf8')
}

/**
 * Returns a deterministic HMAC-SHA256 hex digest of the value for indexed search.
 * Normalizes to lowercase before hashing to support case-insensitive lookups.
 */
export function hashForSearch(value: string, keyBuf: Buffer): string {
  return createHmac('sha256', keyBuf).update(value.toLowerCase()).digest('hex')
}
