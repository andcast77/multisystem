/**
 * Helpers for encrypting/decrypting User.twoFactorSecret before DB persistence.
 *
 * Usage (for PLAN-24 MFA implementation):
 *   - On TOTP setup: store encryptTotpSecret(rawSecret) in User.twoFactorSecret
 *   - On TOTP verify: pass decryptTotpSecret(User.twoFactorSecret) to the TOTP library
 *
 * The raw TOTP secret (base32 string from a library like otpauth) must never be
 * stored in plaintext. Always use these helpers when reading/writing twoFactorSecret.
 */

import { encryptField, decryptField, getEncryptionKey } from './field-encryption.js'

/**
 * Encrypts a TOTP secret for storage in User.twoFactorSecret.
 * Throws if FIELD_ENCRYPTION_KEY is not configured.
 */
export function encryptTotpSecret(rawSecret: string): string {
  return encryptField(rawSecret, getEncryptionKey())
}

/**
 * Decrypts a TOTP secret read from User.twoFactorSecret.
 * Throws if FIELD_ENCRYPTION_KEY is not configured or the value is corrupt.
 */
export function decryptTotpSecret(stored: string): string {
  return decryptField(stored, getEncryptionKey())
}
