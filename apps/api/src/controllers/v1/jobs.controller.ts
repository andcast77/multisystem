import type { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify'
import { requireAuth } from '../../core/auth.js'
import { requireCompanyContext, requireRole } from '../../core/auth-context.js'
import { ok } from '../../common/api-response.js'
import { listJobHistory } from '../../jobs/job-history.service.js'
import { ForbiddenError } from '../../common/errors/app-error.js'

async function getJobHistory(
  request: FastifyRequest<{ Querystring: { limit?: string } }>,
  _reply: FastifyReply,
) {
  const companyId = request.companyId
  if (!companyId) throw new ForbiddenError('Company context required')

  const limit = Math.min(100, Math.max(1, parseInt(request.query.limit ?? '50', 10)))
  const result = await listJobHistory(companyId, limit)
  return ok(result)
}

export async function registerRoutes(fastify: FastifyInstance) {
  const guard = [requireAuth, requireCompanyContext, requireRole(['owner', 'admin'])]

  fastify.get<{ Querystring: { limit?: string } }>(
    '/v1/company/jobs/history',
    { preHandler: guard },
    (request, reply) => getJobHistory(request, reply),
  )
}
