import type { FastifyRequest, FastifyReply } from 'fastify'
import type { FastifyInstance } from 'fastify'
import { requireAuth } from '../core/auth.js'
import { sendForbidden, sendServerError } from '../core/errors.js'
import { validateOr400 } from '../core/validate.js'
import { createMemberBodySchema, updateMemberStoresBodySchema } from '../dto/company-members.dto.js'
import { userDisplayName } from '../core/auth.js'
import * as companyMembersService from '../services/company-members.service.js'
import * as companyMembersHelper from '../helpers/company-members.helper.js'

export async function list(request: FastifyRequest<{ Params: { companyId: string } }>, reply: FastifyReply) {
  try {
    const { companyId } = request.params
    const caller = request.user!
    const result = await companyMembersService.list(companyId, caller)
    if (!result) return sendForbidden(reply, 'No tienes acceso a esta empresa')
    const data = result.members.map((m: (typeof result.members)[number]) =>
      companyMembersHelper.toMemberResponse(m, m.membershipRole === 'USER' ? (result.userStoresMap.get(m.userId) ?? []) : undefined)
    )
    return { success: true, data }
  } catch (error) {
    return sendServerError(reply, error, request.log)
  }
}

export async function create(request: FastifyRequest<{ Params: { companyId: string }; Body: unknown }>, reply: FastifyReply) {
  try {
    const { companyId } = request.params
    const body = validateOr400(reply, createMemberBodySchema, request.body)
    if (body === null) return
    const caller = request.user!
    const result = await companyMembersService.create(companyId, caller, body)
    if ('error' in result) {
      reply.code(result.code ?? 500)
      return { success: false, error: result.error }
    }
    return {
      success: true,
      data: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        name: userDisplayName(result.user),
        membershipRole: result.membershipRole,
      },
    }
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al crear miembro')
  }
}

export async function updateStores(
  request: FastifyRequest<{ Params: { companyId: string; userId: string }; Body: unknown }>,
  reply: FastifyReply
) {
  try {
    const { companyId, userId } = request.params
    const body = validateOr400(reply, updateMemberStoresBodySchema, request.body)
    if (body === null) return
    const caller = request.user!
    const result = await companyMembersService.updateStores(companyId, userId, caller, body)
    if ('error' in result) {
      reply.code(result.code ?? 500)
      return { success: false, error: result.error }
    }
    return { success: true, data: { storeIds: result.storeIds } }
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al actualizar locales')
  }
}

export async function registerRoutes(fastify: FastifyInstance) {
  fastify.get<{ Params: { companyId: string } }>('/api/companies/:companyId/members', { preHandler: [requireAuth] }, (request, reply) => list(request, reply))
  fastify.post<{ Params: { companyId: string }; Body: unknown }>('/api/companies/:companyId/members', { preHandler: [requireAuth] }, (request, reply) => create(request, reply))
  fastify.put<{ Params: { companyId: string; userId: string }; Body: unknown }>('/api/companies/:companyId/members/:userId/stores', { preHandler: [requireAuth] }, (request, reply) => updateStores(request, reply))
}
