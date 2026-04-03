import type { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify'
import { requireAuth } from '../../core/auth.js'
import { requireCompanyContext, requireRole } from '../../core/auth-context.js'
import { ok } from '../../common/api-response.js'
import * as auditLogService from '../../services/audit-log.service.js'
import { ForbiddenError } from '../../common/errors/app-error.js'

async function listAuditLogs(
  request: FastifyRequest<{
    Querystring: {
      entityType?: string
      action?: string
      userId?: string
      dateFrom?: string
      dateTo?: string
      page?: string
      pageSize?: string
    }
  }>,
  reply: FastifyReply
) {
  const companyId = request.companyId
  if (!companyId) throw new ForbiddenError('Company context required')

  const result = await auditLogService.listAuditLogs(companyId, request.query)
  return ok(result)
}

export async function registerRoutes(fastify: FastifyInstance) {
  const guard = [requireAuth, requireCompanyContext, requireRole(['owner', 'admin'])]
  fastify.get<{
    Querystring: {
      entityType?: string
      action?: string
      userId?: string
      dateFrom?: string
      dateTo?: string
      page?: string
      pageSize?: string
    }
  }>('/v1/company/audit-logs', { preHandler: guard }, (request, reply) => listAuditLogs(request, reply))
}
