import type { FastifyRequest, FastifyReply } from 'fastify'
import type { FastifyInstance } from 'fastify'
import { requireAuth } from '../core/auth.js'
import { validateBody, validateQuery } from '../core/validate.js'
import {
  loginBodySchema,
  registerBodySchema,
  verifyTokenSchema,
  setContextSchema,
  createSessionSchema,
  terminateOthersSessionsSchema,
  validateSessionQuerySchema,
  listSessionsQuerySchema,
} from '../dto/auth.dto.js'
import { ForbiddenError } from '../common/errors/app-error.js'
import { ok } from '../common/api-response.js'
import * as authService from '../services/auth.service.js'
import { attachAuthSessionCookie, clearAuthSessionCookie } from '../core/session-cookie.js'
import { getConfig } from '../core/config.js'

export async function login(request: FastifyRequest, reply: FastifyReply) {
  const body = validateBody(loginBodySchema, request.body)
  const result = await authService.login(body)
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

export async function logout(_request: FastifyRequest, reply: FastifyReply) {
  clearAuthSessionCookie(reply, getConfig())
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
  if (decoded.id !== body.userId && !decoded.isSuperuser) {
    throw new ForbiddenError('Solo puedes crear sesión para tu propio usuario')
  }
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
  if (decoded.id !== userId && !decoded.isSuperuser) {
    throw new ForbiddenError('Solo puedes listar tus propias sesiones')
  }
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

/** Login, register, verify — own rate-limit bucket (see server.ts). */
export async function registerPublicAuthRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: { email: string; password: string; companyId?: string } }>(
    '/api/auth/login',
    (request, reply) => login(request, reply)
  )
  fastify.post('/api/auth/register', (request, reply) => register(request, reply))
  fastify.post<{ Body: { token: string } }>('/api/auth/verify', (request, reply) => verify(request, reply))
}

export async function registerProtectedAuthRoutes(fastify: FastifyInstance) {
  fastify.post('/api/auth/logout', (request, reply) => logout(request, reply))
  fastify.get('/api/auth/me', { preHandler: [requireAuth] }, (request, reply) => me(request, reply))
  fastify.get('/api/auth/companies', { preHandler: [requireAuth] }, (request, reply) => listCompanies(request, reply))
  fastify.post<{ Body: { companyId: string } }>('/api/auth/context', { preHandler: [requireAuth] }, (request, reply) => setContext(request, reply))
  fastify.post<{
    Body: { userId: string; sessionToken: string; ipAddress?: string; userAgent?: string; expiresAt?: string }
  }>('/api/auth/sessions', { preHandler: [requireAuth] }, (request, reply) => createSession(request, reply))
  fastify.get<{ Querystring: { token?: string } }>(
    '/api/auth/sessions/validate', (request, reply) => validateSession(request, reply))
  fastify.get<{ Querystring: { userId: string } }>(
    '/api/auth/sessions', { preHandler: [requireAuth] }, (request, reply) => listSessions(request, reply))
  fastify.delete<{ Params: { token: string } }>(
    '/api/auth/sessions/:token', { preHandler: [requireAuth] }, (request, reply) => deleteSession(request, reply))
  fastify.post<{ Body: { userId: string; currentSessionToken: string } }>(
    '/api/auth/sessions/terminate-others', { preHandler: [requireAuth] }, (request, reply) => terminateOthersSessions(request, reply))
  fastify.post(
    '/api/auth/sessions/cleanup-expired', { preHandler: [requireAuth] }, (request, reply) => cleanupExpiredSessions(request, reply))
  fastify.put<{ Params: { userId: string }; Body: { allowConcurrentSessions?: boolean } }>(
    '/api/auth/users/:userId/concurrent-sessions', { preHandler: [requireAuth] }, (request, reply) => updateConcurrentSessions(request, reply))
}

export async function registerRoutes(fastify: FastifyInstance) {
  await registerPublicAuthRoutes(fastify)
  await registerProtectedAuthRoutes(fastify)
}
