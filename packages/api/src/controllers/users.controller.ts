import type { FastifyRequest, FastifyReply } from 'fastify'
import type { FastifyInstance } from 'fastify'
import { requireAuth } from '../core/auth.js'
import { sendForbidden, sendServerError } from '../core/errors.js'
import { validateOr400 } from '../core/validate.js'
import { createUserBodySchema, updateUserBodySchema } from '../dto/users.dto.js'
import * as usersService from '../services/users.service.js'
import * as usersHelper from '../helpers/users.helper.js'

export async function list(request: FastifyRequest, reply: FastifyReply) {
  try {
    const caller = request.user!
    const users = await usersService.listUsers(caller)
    if (users === null) {
      return sendForbidden(reply, 'Solo administradores pueden listar usuarios')
    }
    return { success: true, data: usersHelper.toUserListResponse(users) }
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al obtener usuarios')
  }
}

export async function getById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    const { id } = request.params
    const user = await usersService.getById(id)
    if (!user) {
      reply.code(404)
      return { success: false, error: 'Usuario no encontrado' }
    }
    return { success: true, data: usersHelper.toUserResponse(user) }
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al obtener usuario')
  }
}

export async function create(request: FastifyRequest, reply: FastifyReply) {
  try {
    const body = validateOr400(reply, createUserBodySchema, request.body)
    if (body === null) return

    const result = await usersService.create(body)
    if ('error' in result) {
      reply.code(result.code)
      return { success: false, error: result.error }
    }
    return { success: true, data: usersHelper.toUserResponse(result) }
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al crear usuario')
  }
}

export async function update(request: FastifyRequest<{ Params: { id: string }; Body: unknown }>, reply: FastifyReply) {
  try {
    const { id } = request.params
    const body = validateOr400(reply, updateUserBodySchema, request.body)
    if (body === null) return

    const result = await usersService.update(id, body)
    if ('error' in result) {
      reply.code(result.code)
      return { success: false, error: result.error }
    }
    return { success: true, data: usersHelper.toUserResponse(result) }
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al actualizar usuario')
  }
}

export async function remove(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    const { id } = request.params
    const result = await usersService.remove(id)
    if ('error' in result) {
      reply.code(result.code)
      return { success: false, error: result.error }
    }
    return { success: true, data: { success: true } }
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al eliminar usuario')
  }
}

export async function registerRoutes(fastify: FastifyInstance) {
  fastify.get('/api/users', { preHandler: [requireAuth] }, (request, reply) => list(request, reply))
  fastify.get<{ Params: { id: string } }>('/api/users/:id', { preHandler: [requireAuth] }, (request, reply) => getById(request, reply))
  fastify.post('/api/users', { preHandler: [requireAuth] }, (request, reply) => create(request, reply))
  fastify.put<{ Params: { id: string }; Body: unknown }>('/api/users/:id', { preHandler: [requireAuth] }, (request, reply) => update(request, reply))
  fastify.delete<{ Params: { id: string } }>('/api/users/:id', { preHandler: [requireAuth] }, (request, reply) => remove(request, reply))
}
