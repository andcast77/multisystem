import jwt from 'jsonwebtoken'
import { FastifyRequest, FastifyReply } from 'fastify'
import { getConfig } from './config.js'
import { AUTH_SESSION_COOKIE } from './session-cookie.js'

export type TokenPayload = {
  id: string
  email: string
  role: string
  companyId?: string
  isSuperuser?: boolean
  membershipRole?: string
}

function getJwtConfig() {
  const config = getConfig()
  return {
    secret: config.JWT_SECRET,
    expiresIn: config.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  }
}

export function generateToken(payload: TokenPayload): string {
  const { secret, expiresIn } = getJwtConfig()
  return jwt.sign(payload, secret, { expiresIn })
}

/** Nombre para respuestas API (firstName + lastName o email) */
export function userDisplayName(user: {
  firstName?: string;
  lastName?: string;
  email: string;
}): string {
  if (user.firstName != null && user.lastName != null) {
    const n = `${user.firstName} ${user.lastName}`.trim();
    if (n) return n;
  }
  return user.email;
}

const MFA_PENDING_TYP = 'mfa_pending' as const

export type MfaPendingVerifyResult = { userId: string }

/**
 * Short-lived JWT after password OK when MFA is required. Not accepted by `verifyToken` / `requireAuth`.
 */
export function generateMfaPendingToken(userId: string): string {
  const { secret } = getJwtConfig()
  return jwt.sign({ typ: MFA_PENDING_TYP, sub: userId }, secret, { expiresIn: '5m' })
}

export function verifyMfaPendingToken(token: string): MfaPendingVerifyResult | null {
  try {
    const { secret } = getJwtConfig()
    const decoded = jwt.verify(token, secret) as jwt.JwtPayload & { typ?: string; sub?: string }
    if (decoded.typ !== MFA_PENDING_TYP || typeof decoded.sub !== 'string' || !decoded.sub) {
      return null
    }
    return { userId: decoded.sub }
  } catch {
    return null
  }
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const { secret } = getJwtConfig()
    const decoded = jwt.verify(token, secret) as jwt.JwtPayload & {
      typ?: string
      id?: string
      email?: string
      role?: string
      companyId?: string
      isSuperuser?: boolean
      membershipRole?: string
    }
    if (decoded.typ === MFA_PENDING_TYP) return null
    const { id, email, role } = decoded
    if (typeof id !== 'string' || typeof email !== 'string' || typeof role !== 'string') return null
    const payload: TokenPayload = { id, email, role }
    if (typeof decoded.companyId === 'string') payload.companyId = decoded.companyId
    if (typeof decoded.isSuperuser === 'boolean') payload.isSuperuser = decoded.isSuperuser
    if (typeof decoded.membershipRole === 'string') payload.membershipRole = decoded.membershipRole
    return payload
  } catch {
    return null
  }
}

const UNAUTHORIZED_MSG = 'Token de autenticación requerido'
const INVALID_TOKEN_MSG = 'Token inválido o expirado'

function getBearerToken(request: FastifyRequest): string | null {
  const authHeader = request.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null
  return authHeader.substring(7)
}

function getSessionTokenFromCookie(request: FastifyRequest): string | null {
  const raw = request.headers.cookie
  if (!raw) return null
  const prefix = `${AUTH_SESSION_COOKIE}=`
  for (const part of raw.split(';')) {
    const p = part.trim()
    if (p.startsWith(prefix)) {
      try {
        return decodeURIComponent(p.slice(prefix.length))
      } catch {
        return p.slice(prefix.length)
      }
    }
  }
  return null
}

function getQueryParamToken(request: FastifyRequest): string | null {
  const q = request.query as Record<string, string | undefined>
  const t = q['token']
  return typeof t === 'string' && t.length > 0 ? t : null
}

/**
 * Bearer (API clients/tests), httpOnly session cookie (browsers), or
 * ?token= query param (SSE/WebSocket clients that cannot set headers).
 */
export function getAuthToken(request: FastifyRequest): string | null {
  return getBearerToken(request) ?? getSessionTokenFromCookie(request) ?? getQueryParamToken(request)
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: TokenPayload
  }
}

/**
 * Fastify preHandler: requires valid JWT and attaches request.user.
 * On failure sends 401 and throws so the route handler is not executed.
 */
export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const token = getAuthToken(request)
  if (!token) {
    reply.code(401).send({ success: false, error: UNAUTHORIZED_MSG })
    throw new Error('Unauthorized')
  }
  const decoded = verifyToken(token)
  if (!decoded) {
    reply.code(401).send({ success: false, error: INVALID_TOKEN_MSG })
    throw new Error('Invalid token')
  }
  request.user = decoded
}
