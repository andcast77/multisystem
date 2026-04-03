import type { FastifyRequest, FastifyReply } from 'fastify'
import type { FastifyInstance } from 'fastify'
import { requireAuth } from '../../core/auth.js'
import { validateBody, validateQuery } from '../../core/validate.js'
import {
  loginBodySchema,
  registerBodySchema,
  verifyTokenSchema,
  setContextSchema,
  createSessionSchema,
  terminateOthersSessionsSchema,
  validateSessionQuerySchema,
  listSessionsQuerySchema,
} from '../../dto/auth.dto.js'
import { ok } from '../../common/api-response.js'
import * as authService from '../../services/auth.service.js'
import { attachAuthSessionCookie, clearAuthSessionCookie } from '../../core/session-cookie.js'
import { getConfig } from '../../core/config.js'
import { apiOkEnvelope200 } from '../../common/fastify-response-schemas.js'
import { assertSelfOrSuperuser } from '../../policies/company-authorization.policy.js'
import { writeAuditLog } from '../../services/audit-log.service.js'

export async function login(request: FastifyRequest, reply: FastifyReply) {
  const body = validateBody(loginBodySchema, request.body)
  const ip = request.ip
  const ua = (request.headers['user-agent'] as string | undefined) ?? null

  let result: Awaited<ReturnType<typeof authService.login>>
  try {
    result = await authService.login(body)
  } catch (err) {
    if (body.companyId) {
      writeAuditLog({ companyId: body.companyId, action: 'LOGIN_FAILED', entityType: 'auth', ipAddress: ip, userAgent: ua })
    }
    throw err
  }

  if (result.companyId) {
    writeAuditLog({
      companyId: result.companyId,
      userId: result.user.id,
      action: 'LOGIN_SUCCESS',
      entityType: 'auth',
      entityId: result.user.id,
      ipAddress: ip,
      userAgent: ua,
    })
  }

  const { token, ...data } = result
  attachAuthSessionCookie(reply, token, getConfig())
  return ok(data)
}

export async function register(request: FastifyRequest, reply: FastifyReply) {
  const body = validateBody(registerBodySchema, request.body)
  const result = await authService.register(body)
  const { token, ...data } = result
  attachAuthSessionCookie(reply, token, getConfig())
  return ok(data)
}

export async function me(request: FastifyRequest, reply: FastifyReply) {
  const result = await authService.me(request.user!)
  return ok(result)
}

export async function logout(request: FastifyRequest, reply: FastifyReply) {
  clearAuthSessionCookie(reply, getConfig())
  const caller = request.user
  if (caller?.companyId) {
    writeAuditLog({
      companyId: caller.companyId,
      userId: caller.id,
      action: 'LOGOUT',
      entityType: 'auth',
      entityId: caller.id,
      ipAddress: request.ip,
      userAgent: (request.headers['user-agent'] as string | undefined) ?? null,
    })
  }
  return { success: true }
}

export async function verify(request: FastifyRequest, reply: FastifyReply) {
  const { token } = validateBody(verifyTokenSchema, request.body)
  const result = await authService.verify(token)
  return ok(result)
}

export async function listCompanies(request: FastifyRequest, reply: FastifyReply) {
  const decoded = request.user!
  const companies = await authService.getCompanies(decoded.id, decoded.isSuperuser ?? false)
  return ok(companies)
}

export async function setContext(request: FastifyRequest, reply: FastifyReply) {
  const { companyId } = validateBody(setContextSchema, request.body)
  const decoded = request.user!
  const result = await authService.setContext(decoded, companyId)
  const { token, ...data } = result
  attachAuthSessionCookie(reply, token, getConfig())
  return ok(data)
}

export async function createSession(request: FastifyRequest, reply: FastifyReply) {
  const body = validateBody(createSessionSchema, request.body)
  const decoded = request.user!
  assertSelfOrSuperuser(decoded.id, body.userId, decoded.isSuperuser, 'Solo puedes crear sesión para tu propio usuario')
  await authService.createSession(body)
  return { success: true }
}

export async function validateSession(request: FastifyRequest, reply: FastifyReply) {
  const { token } = validateQuery(validateSessionQuerySchema, request.query)
  const result = await authService.validateSession(token)
  return ok(result)
}

export async function listSessions(request: FastifyRequest, reply: FastifyReply) {
  const { userId } = validateQuery(listSessionsQuerySchema, request.query)
  const decoded = request.user!
  assertSelfOrSuperuser(decoded.id, userId, decoded.isSuperuser, 'Solo puedes listar tus propias sesiones')
  const rows = await authService.listSessions(userId)
  return ok(rows)
}

export async function deleteSession(
  request: FastifyRequest<{ Params: { token: string } }>,
  reply: FastifyReply
) {
  const caller = request.user!
  await authService.deleteSession(request.params.token, caller.id, caller.isSuperuser ?? false)
  return { success: true }
}

export async function terminateOthersSessions(request: FastifyRequest, reply: FastifyReply) {
  const { userId, currentSessionToken } = validateBody(terminateOthersSessionsSchema, request.body)
  const caller = request.user!
  await authService.terminateOthersSessions(userId, currentSessionToken, caller.id, caller.isSuperuser ?? false)
  return { success: true }
}

export async function cleanupExpiredSessions(request: FastifyRequest, reply: FastifyReply) {
  const result = await authService.cleanupExpiredSessions(request.user?.isSuperuser ?? false)
  return ok(result)
}

export async function updateConcurrentSessions(
  request: FastifyRequest<{ Params: { userId: string }; Body: { allowConcurrentSessions?: boolean } }>,
  reply: FastifyReply
) {
  const caller = request.user!
  await authService.updateConcurrentSessions(request.params.userId, caller.id, caller.isSuperuser ?? false)
  return { success: true }
}

const authSuccessResponseSchema = {
  response: {
    200: apiOkEnvelope200,
  },
} as const

/** Login, register, verify — own rate-limit bucket (see server.ts). */
export async function registerPublicAuthRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: { email: string; password: string; companyId?: string } }>(
    '/v1/auth/login',
    { schema: authSuccessResponseSchema },
    (request, reply) => login(request, reply)
  )
  fastify.post('/v1/auth/register', { schema: authSuccessResponseSchema }, (request, reply) =>
    register(request, reply)
  )
  fastify.post<{ Body: { token: string } }>(
    '/v1/auth/verify',
    { schema: authSuccessResponseSchema },
    (request, reply) => verify(request, reply)
  )
}

export async function registerProtectedAuthRoutes(fastify: FastifyInstance) {
  fastify.post('/v1/auth/logout', (request, reply) => logout(request, reply))
  fastify.get('/v1/auth/me', { preHandler: [requireAuth] }, (request, reply) => me(request, reply))
  fastify.get('/v1/auth/companies', { preHandler: [requireAuth] }, (request, reply) => listCompanies(request, reply))
  fastify.post<{ Body: { companyId: string } }>('/v1/auth/context', { preHandler: [requireAuth] }, (request, reply) => setContext(request, reply))
  fastify.post<{
    Body: { userId: string; sessionToken: string; ipAddress?: string; userAgent?: string; expiresAt?: string }
  }>('/v1/auth/sessions', { preHandler: [requireAuth] }, (request, reply) => createSession(request, reply))
  fastify.get<{ Querystring: { token?: string } }>(
    '/v1/auth/sessions/validate', (request, reply) => validateSession(request, reply))
  fastify.get<{ Querystring: { userId: string } }>(
    '/v1/auth/sessions', { preHandler: [requireAuth] }, (request, reply) => listSessions(request, reply))
  fastify.delete<{ Params: { token: string } }>(
    '/v1/auth/sessions/:token', { preHandler: [requireAuth] }, (request, reply) => deleteSession(request, reply))
  fastify.post<{ Body: { userId: string; currentSessionToken: string } }>(
    '/v1/auth/sessions/terminate-others', { preHandler: [requireAuth] }, (request, reply) => terminateOthersSessions(request, reply))
  fastify.post(
    '/v1/auth/sessions/cleanup-expired', { preHandler: [requireAuth] }, (request, reply) => cleanupExpiredSessions(request, reply))
  fastify.put<{ Params: { userId: string }; Body: { allowConcurrentSessions?: boolean } }>(
    '/v1/auth/users/:userId/concurrent-sessions', { preHandler: [requireAuth] }, (request, reply) => updateConcurrentSessions(request, reply))
}

export async function registerRoutes(fastify: FastifyInstance) {
  await registerPublicAuthRoutes(fastify)
  await registerProtectedAuthRoutes(fastify)
}
