import type { FastifyRequest, FastifyReply } from 'fastify'
import type { FastifyInstance } from 'fastify'
import { requireAuth } from '../core/auth.js'
import { requireCompanyContext, requireRole } from '../core/auth-context.js'
import { validateBody } from '../core/validate.js'
import { createUserBodySchema, updateUserBodySchema } from '../dto/users.dto.js'
import { ok } from '../common/api-response.js'
import * as usersService from '../services/users.service.js'
import * as usersHelper from '../helpers/users.helper.js'

export async function list(request: FastifyRequest, reply: FastifyReply) {
  const caller = { ...request.user!, companyId: request.companyId, membershipRole: request.membershipRole ?? undefined }
  const users = await usersService.listUsers(caller)
  return ok(usersHelper.toUserListResponse(users))
}

export async function getById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const caller = { ...request.user!, companyId: request.companyId, membershipRole: request.membershipRole ?? undefined }
  const user = await usersService.getById(request.params.id, caller)
  return ok(usersHelper.toUserResponse(user))
}

export async function create(request: FastifyRequest, reply: FastifyReply) {
  const body = validateBody(createUserBodySchema, request.body)
  const caller = { ...request.user!, companyId: request.companyId, membershipRole: request.membershipRole ?? undefined }
  const user = await usersService.create(body, caller)
  return ok(usersHelper.toUserResponse(user))
}

export async function update(request: FastifyRequest<{ Params: { id: string }; Body: unknown }>, reply: FastifyReply) {
  const body = validateBody(updateUserBodySchema, request.body)
  const caller = { ...request.user!, companyId: request.companyId, membershipRole: request.membershipRole ?? undefined }
  const user = await usersService.update(request.params.id, body, caller)
  return ok(usersHelper.toUserResponse(user))
}

export async function remove(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const caller = { ...request.user!, companyId: request.companyId, membershipRole: request.membershipRole ?? undefined }
  await usersService.remove(request.params.id, caller)
  return { success: true }
}

export async function registerRoutes(fastify: FastifyInstance) {
  const usersGuard = [requireAuth, requireCompanyContext, requireRole(['owner', 'admin'])]
  fastify.get('/api/users', { preHandler: usersGuard }, (request, reply) => list(request, reply))
  fastify.get<{ Params: { id: string } }>('/api/users/:id', { preHandler: usersGuard }, (request, reply) => getById(request, reply))
  fastify.post('/api/users', { preHandler: usersGuard }, (request, reply) => create(request, reply))
  fastify.put<{ Params: { id: string }; Body: unknown }>('/api/users/:id', { preHandler: usersGuard }, (request, reply) => update(request, reply))
  fastify.delete<{ Params: { id: string } }>('/api/users/:id', { preHandler: usersGuard }, (request, reply) => remove(request, reply))
}
