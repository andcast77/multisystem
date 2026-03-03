import type { FastifyRequest, FastifyReply } from 'fastify'
import type { FastifyInstance } from 'fastify'
import { requireAuth } from '../core/auth.js'
import { sendForbidden, sendNotFound, sendServerError } from '../core/errors.js'
import { canAccessCompany } from '../core/permissions.js'
import { validateOr400 } from '../core/validate.js'
import { updateCompanyBodySchema } from '../dto/companies.dto.js'
import * as companiesService from '../services/companies.service.js'
import * as companiesHelper from '../helpers/companies.helper.js'

export async function getById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    const { id: companyId } = request.params
    const caller = request.user!
    if (!canAccessCompany(caller, companyId)) return sendForbidden(reply, 'No tienes acceso a esta empresa')
    const company = await companiesService.getById(companyId)
    if (!company) return sendNotFound(reply, 'Empresa no encontrada')
    const data = await companiesHelper.toCompanyResponse(company)
    return { success: true, data }
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al obtener la empresa')
  }
}

export async function getStats(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    const { id: companyId } = request.params
    const caller = request.user!
    if (!canAccessCompany(caller, companyId)) {
      reply.code(403)
      return { success: false, error: 'No tienes acceso a esta empresa' }
    }
    const result = await companiesService.getStats(companyId)
    const lastMemberData = companiesHelper.toCompanyStatsLastMember(result.lastMember)
    return {
      success: true,
      data: {
        totalMembers: result.totalMembers,
        ownerCount: result.ownerCount,
        adminCount: result.adminCount,
        userCount: result.userCount,
        lastMember: lastMemberData,
      },
    }
  } catch (error) {
    request.log.error(error)
    reply.code(500)
    return { success: false, error: 'Error al obtener estadísticas de la empresa' }
  }
}

export async function update(request: FastifyRequest<{ Params: { id: string }; Body: unknown }>, reply: FastifyReply) {
  try {
    const { id: companyId } = request.params
    const body = validateOr400(reply, updateCompanyBodySchema, request.body)
    if (body === null) return

    const caller = request.user!
    const result = await companiesService.update(companyId, caller, body)
    if ('error' in result) {
      reply.code(result.code)
      return { success: false, error: result.error }
    }
    return {
      success: true,
      data: { id: result.id, name: result.name, modules: result.modules, updatedAt: result.updatedAt },
      message: 'Empresa actualizada correctamente',
    }
  } catch (error: unknown) {
    request.log.error(error)
    const err = error as { message?: string; code?: string }
    if (err?.code === 'P2002' || err?.message?.includes('unique constraint')) {
      reply.code(409)
      return { success: false, error: 'Ya existe una empresa con ese nombre' }
    }
    reply.code(500)
    return { success: false, error: 'Error al actualizar la empresa' }
  }
}

export async function remove(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    const { id: companyId } = request.params
    const caller = request.user!
    const result = await companiesService.remove(companyId, caller)
    if ('error' in result) {
      reply.code(result.code)
      return { success: false, error: result.error }
    }
    return { success: true, message: 'Empresa eliminada correctamente' }
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al eliminar la empresa')
  }
}

export async function registerRoutes(fastify: FastifyInstance) {
  fastify.get<{ Params: { id: string } }>('/api/companies/:id', { preHandler: [requireAuth] }, (request, reply) => getById(request, reply))
  fastify.get<{ Params: { id: string } }>('/api/companies/:id/stats', { preHandler: [requireAuth] }, (request, reply) => getStats(request, reply))
  fastify.put<{ Params: { id: string }; Body: unknown }>('/api/companies/:id', { preHandler: [requireAuth] }, (request, reply) => update(request, reply))
  fastify.delete<{ Params: { id: string } }>('/api/companies/:id', { preHandler: [requireAuth] }, (request, reply) => remove(request, reply))
}
