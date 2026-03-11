import type { FastifyRequest, FastifyReply } from 'fastify'
import type { FastifyInstance } from 'fastify'
import { requireAuth } from '../core/auth.js'
import { canAccessCompany } from '../core/permissions.js'
import { validateBody } from '../core/validate.js'
import { updateCompanyBodySchema } from '../dto/companies.dto.js'
import { ForbiddenError } from '../common/errors/app-error.js'
import { ok } from '../common/api-response.js'
import * as companiesService from '../services/companies.service.js'
import * as companiesHelper from '../helpers/companies.helper.js'

export async function getById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const { id: companyId } = request.params
  if (!canAccessCompany(request.user!, companyId)) throw new ForbiddenError('No tienes acceso a esta empresa')
  const company = await companiesService.getById(companyId)
  const data = await companiesHelper.toCompanyResponse(company)
  return ok(data)
}

export async function getStats(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const { id: companyId } = request.params
  if (!canAccessCompany(request.user!, companyId)) throw new ForbiddenError('No tienes acceso a esta empresa')
  const result = await companiesService.getStats(companyId)
  const lastMemberData = companiesHelper.toCompanyStatsLastMember(result.lastMember)
  return ok({
    totalMembers: result.totalMembers,
    ownerCount: result.ownerCount,
    adminCount: result.adminCount,
    userCount: result.userCount,
    lastMember: lastMemberData,
  })
}

export async function update(request: FastifyRequest<{ Params: { id: string }; Body: unknown }>, reply: FastifyReply) {
  const body = validateBody(updateCompanyBodySchema, request.body)
  const result = await companiesService.update(request.params.id, request.user!, body)
  return {
    success: true,
    data: { id: result.id, name: result.name, modules: result.modules, updatedAt: result.updatedAt },
    message: 'Empresa actualizada correctamente',
  }
}

export async function remove(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  await companiesService.remove(request.params.id, request.user!)
  return { success: true, message: 'Empresa eliminada correctamente' }
}

export async function registerRoutes(fastify: FastifyInstance) {
  fastify.get<{ Params: { id: string } }>('/api/companies/:id', { preHandler: [requireAuth] }, (request, reply) => getById(request, reply))
  fastify.get<{ Params: { id: string } }>('/api/companies/:id/stats', { preHandler: [requireAuth] }, (request, reply) => getStats(request, reply))
  fastify.put<{ Params: { id: string }; Body: unknown }>('/api/companies/:id', { preHandler: [requireAuth] }, (request, reply) => update(request, reply))
  fastify.delete<{ Params: { id: string } }>('/api/companies/:id', { preHandler: [requireAuth] }, (request, reply) => remove(request, reply))
}
