import { prisma } from '../db/index.js'
import { BadRequestError, UnauthorizedError } from '../common/errors/app-error.js'
import {
  buildOtpauthUrl,
  decryptTotpSecret,
  deleteBackupCodesForUser,
  encryptTotpSecret,
  generatePlainBackupCodes,
  generateTotpRawSecret,
  listBackupCodeMeta,
  MFA_BACKUP_CODE_COUNT,
  otpauthUrlToQrDataUrl,
  persistBackupCodesForUser,
  verifyBackupCodeAndConsume,
  verifyTotp,
} from './mfa.service.js'

export async function setupMfa(userId: string, userEmail: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, twoFactorEnabled: true },
  })
  if (!user) throw new BadRequestError('Usuario no encontrado')
  if (user.twoFactorEnabled) throw new BadRequestError('MFA ya está activado')

  const rawSecret = generateTotpRawSecret()
  const encrypted = encryptTotpSecret(rawSecret)
  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorSecret: encrypted, twoFactorEnabled: false },
  })

  const otpauthUrl = buildOtpauthUrl(userEmail, rawSecret)
  const qrDataUrl = await otpauthUrlToQrDataUrl(otpauthUrl)
  return { otpauthUrl, qrDataUrl }
}

export async function confirmMfa(userId: string, totpCode: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, twoFactorEnabled: true, twoFactorSecret: true },
  })
  if (!user?.twoFactorSecret) throw new BadRequestError('No hay configuración MFA pendiente')

  if (user.twoFactorEnabled) throw new BadRequestError('MFA ya está activado')

  let ok = false
  try {
    const raw = decryptTotpSecret(user.twoFactorSecret)
    ok = verifyTotp(raw, totpCode)
  } catch {
    ok = false
  }
  if (!ok) throw new UnauthorizedError('Código TOTP inválido')

  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorEnabled: true },
  })

  await deleteBackupCodesForUser(userId)
  const plainCodes = generatePlainBackupCodes(MFA_BACKUP_CODE_COUNT)
  await persistBackupCodesForUser(userId, plainCodes)

  return { backupCodes: plainCodes }
}

export async function disableMfa(userId: string, totpCode?: string, backupCode?: string) {
  const t = totpCode?.trim()
  const b = backupCode?.trim()
  if (!t && !b) throw new BadRequestError('Código TOTP o código de respaldo requerido')
  if (t && b) throw new BadRequestError('Envía solo un tipo de código')

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { twoFactorEnabled: true, twoFactorSecret: true },
  })
  if (!user?.twoFactorEnabled || !user.twoFactorSecret) {
    throw new BadRequestError('MFA no está activado')
  }

  let ok = false
  if (t) {
    try {
      const raw = decryptTotpSecret(user.twoFactorSecret)
      ok = verifyTotp(raw, t)
    } catch {
      ok = false
    }
  } else if (b) {
    ok = await verifyBackupCodeAndConsume(userId, b)
  }

  if (!ok) throw new UnauthorizedError('Código inválido')

  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorEnabled: false, twoFactorSecret: null },
  })
  await deleteBackupCodesForUser(userId)
}

export async function getBackupCodesMeta(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { twoFactorEnabled: true },
  })
  if (!user?.twoFactorEnabled) throw new BadRequestError('MFA no está activado')
  return listBackupCodeMeta(userId)
}

export async function regenerateBackupCodes(userId: string, totpCode: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { twoFactorEnabled: true, twoFactorSecret: true },
  })
  if (!user?.twoFactorEnabled || !user.twoFactorSecret) {
    throw new BadRequestError('MFA no está activado')
  }

  let ok = false
  try {
    const raw = decryptTotpSecret(user.twoFactorSecret)
    ok = verifyTotp(raw, totpCode)
  } catch {
    ok = false
  }
  if (!ok) throw new UnauthorizedError('Código TOTP inválido')

  await deleteBackupCodesForUser(userId)
  const plainCodes = generatePlainBackupCodes(MFA_BACKUP_CODE_COUNT)
  await persistBackupCodesForUser(userId, plainCodes)
  return { backupCodes: plainCodes }
}
