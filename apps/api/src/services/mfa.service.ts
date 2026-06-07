import { randomBytes } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { generateSecret, generateURI, verifySync } from 'otplib'
import QRCode from 'qrcode'
import { prisma } from '../db/index.js'
import { getConfig } from '../core/config.js'
import { encryptTotpSecret, decryptTotpSecret } from '../common/crypto/totp-secret.js'

export const MFA_BACKUP_CODE_COUNT = 8

const BACKUP_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'

function randomSegment(len: number): string {
  let s = ''
  const bytes = randomBytes(len * 2)
  for (let i = 0; i < len; i++) {
    s += BACKUP_ALPHABET[bytes[i]! % BACKUP_ALPHABET.length]
  }
  return s
}

/** Human-readable backup codes (single-use). */
export function generatePlainBackupCodes(count = MFA_BACKUP_CODE_COUNT): string[] {
  return Array.from({ length: count }, () => `${randomSegment(4)}-${randomSegment(4)}-${randomSegment(4)}`)
}

export function normalizeBackupCodeInput(code: string): string {
  return code.replace(/[\s-]/g, '').toUpperCase()
}

export async function hashBackupCode(normalized: string): Promise<string> {
  return bcrypt.hash(normalized, 10)
}

export function generateTotpRawSecret(): string {
  return generateSecret()
}

export function buildOtpauthUrl(userEmail: string, rawSecret: string): string {
  const issuer = getConfig().MFA_TOTP_ISSUER
  return generateURI({
    issuer,
    label: userEmail,
    secret: rawSecret,
  })
}

export async function otpauthUrlToQrDataUrl(otpauthUrl: string): Promise<string> {
  return QRCode.toDataURL(otpauthUrl, { margin: 1, width: 220, errorCorrectionLevel: 'M' })
}

export function verifyTotp(decryptedSecret: string, token: string): boolean {
  const trimmed = token.replace(/\s/g, '')
  if (!trimmed) return false
  const result = verifySync({
    secret: decryptedSecret,
    token: trimmed,
    epochTolerance: 30,
  })
  return result.valid === true
}

export async function persistBackupCodesForUser(userId: string, plainCodes: string[]): Promise<void> {
  const rows = await Promise.all(
    plainCodes.map(async (plain) => {
      const normalized = normalizeBackupCodeInput(plain)
      const codeHash = await hashBackupCode(normalized)
      return { userId, codeHash }
    })
  )
  await prisma.mfaBackupCode.createMany({ data: rows })
}

export async function deleteBackupCodesForUser(userId: string): Promise<void> {
  await prisma.mfaBackupCode.deleteMany({ where: { userId } })
}

export type BackupCodeListItem = {
  id: string
  createdAt: string
  usedAt: string | null
}

export async function listBackupCodeMeta(userId: string): Promise<BackupCodeListItem[]> {
  const rows = await prisma.mfaBackupCode.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
    select: { id: true, createdAt: true, usedAt: true },
  })
  return rows.map((r) => ({
    id: r.id,
    createdAt: r.createdAt.toISOString(),
    usedAt: r.usedAt ? r.usedAt.toISOString() : null,
  }))
}

/**
 * Finds an unused backup code matching `plain`, marks it used. Returns whether a match was consumed.
 */
export async function verifyBackupCodeAndConsume(userId: string, plain: string): Promise<boolean> {
  const normalized = normalizeBackupCodeInput(plain)
  if (normalized.length < 8) return false

  const rows = await prisma.mfaBackupCode.findMany({
    where: { userId, usedAt: null },
    select: { id: true, codeHash: true },
  })

  for (const row of rows) {
    const ok = await bcrypt.compare(normalized, row.codeHash)
    if (ok) {
      await prisma.mfaBackupCode.update({
        where: { id: row.id },
        data: { usedAt: new Date() },
      })
      return true
    }
  }
  return false
}

export { encryptTotpSecret, decryptTotpSecret }
