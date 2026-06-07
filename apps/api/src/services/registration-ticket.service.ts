import jwt from 'jsonwebtoken'
import { randomBytes } from 'node:crypto'
import { getRedis } from '../common/cache/redis.js'
import type { AppConfig } from '../core/config.js'
import { getConfig, getRegistrationTicketSecret } from '../core/config.js'
import { BadRequestError } from '../common/errors/app-error.js'

export const REGISTRATION_TICKET_PURPOSE = 'company_register' as const

export type RegistrationTicketPayload = {
  sub: string
  purpose: typeof REGISTRATION_TICKET_PURPOSE
  jti: string
}

function jwtExpiresSeconds(config: AppConfig): number {
  const raw = config.REGISTRATION_TICKET_EXPIRES_IN?.trim() || '15m'
  const m = /^(\d+)\s*([smhd])$/i.exec(raw)
  if (!m) return config.OTP_CHALLENGE_TTL_SECONDS
  const n = Number.parseInt(m[1], 10)
  const u = m[2].toLowerCase()
  const mult = u === 's' ? 1 : u === 'm' ? 60 : u === 'h' ? 3600 : 86400
  return n * mult
}

/** Emit JWT + store `jti` in Redis until consumed at register. */
export async function issueRegistrationTicket(email: string): Promise<string> {
  const config = getConfig()
  const redis = getRedis()
  if (!redis) {
    throw new Error('Redis requerido para emitir ticket de registro')
  }
  const norm = email.trim().toLowerCase()
  const jti = randomBytes(16).toString('hex')
  const secret = getRegistrationTicketSecret(config)
  const ex = jwtExpiresSeconds(config)
  const token = jwt.sign(
    { sub: norm, purpose: REGISTRATION_TICKET_PURPOSE, jti },
    secret,
    { expiresIn: ex },
  )
  await redis.set(`regotp:jti:${jti}`, norm, { ex: Math.max(60, ex) })
  return token
}

export async function verifyAndConsumeRegistrationTicket(
  config: AppConfig,
  email: string,
  token: string,
): Promise<void> {
  const secret = getRegistrationTicketSecret(config)
  let decoded: RegistrationTicketPayload
  try {
    decoded = jwt.verify(token, secret) as RegistrationTicketPayload
  } catch {
    throw new BadRequestError('Ticket de registro inválido o expirado', 'REGISTRATION_TICKET_INVALID')
  }
  if (decoded.purpose !== REGISTRATION_TICKET_PURPOSE || !decoded.jti) {
    throw new BadRequestError('Ticket de registro inválido', 'REGISTRATION_TICKET_INVALID')
  }
  const norm = email.trim().toLowerCase()
  if (decoded.sub !== norm) {
    throw new BadRequestError('El email no coincide con el ticket de verificación', 'REGISTRATION_EMAIL_MISMATCH')
  }
  const redis = getRedis()
  if (!redis) {
    throw new BadRequestError('No se pudo validar el ticket', 'OTP_STORE_UNAVAILABLE')
  }
  const key = `regotp:jti:${decoded.jti}`
  const stored = await redis.get(key)
  if (stored !== norm) {
    throw new BadRequestError('Ticket de registro inválido o ya utilizado', 'REGISTRATION_TICKET_REUSED')
  }
  await redis.del(key)
}
