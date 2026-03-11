import type { FastifyRequest, FastifyReply } from 'fastify'
import type { FastifyInstance } from 'fastify'
import { requireAuth } from '../core/auth.js'
import { validateBody } from '../core/validate.js'
import { createUserBodySchema, updateUserBodySchema } from '../dto/users.dto.js'
import { ok } from '../common/api-response.js'
import * as usersService from '../services/users.service.js'
import * as usersHelper from '../helpers/users.helper.js'

export async function list(request: FastifyRequest, reply: FastifyReply) {
  const users = await usersService.listUsers(request.user!)
  return ok(usersHelper.toUserListResponse(users))
}

export async function getById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const user = await usersService.getById(request.params.id)
  return ok(usersHelper.toUserResponse(user))
}

export async function create(request: FastifyRequest, reply: FastifyReply) {
  const body = validateBody(createUserBodySchema, request.body)
  const user = await usersService.create(body)
  return ok(usersHelper.toUserResponse(user))
}

export async function update(request: FastifyRequest<{ Params: { id: string }; Body: unknown }>, reply: FastifyReply) {
  const body = validateBody(updateUserBodySchema, request.body)
  const user = await usersService.update(request.params.id, body)
  return ok(usersHelper.toUserResponse(user))
}

export async function remove(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  await usersService.remove(request.params.id)
  return { success: true }
}

export async function registerRoutes(fastify: FastifyInstance) {
  fastify.get('/api/users', { preHandler: [requireAuth] }, (request, reply) => list(request, reply))
  fastify.get<{ Params: { id: string } }>('/api/users/:id', { preHandler: [requireAuth] }, (request, reply) => getById(request, reply))
  fastify.post('/api/users', { preHandler: [requireAuth] }, (request, reply) => create(request, reply))
  fastify.put<{ Params: { id: string }; Body: unknown }>('/api/users/:id', { preHandler: [requireAuth] }, (request, reply) => update(request, reply))
  fastify.delete<{ Params: { id: string } }>('/api/users/:id', { preHandler: [requireAuth] }, (request, reply) => remove(request, reply))
}
