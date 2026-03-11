import type { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify'
import { ok } from '../../common/api-response.js'
import * as shopflowService from '../../services/shopflow.service.js'
import { getCtx, handle, pre } from './_shared.js'

async function exportJson(request: FastifyRequest, reply: FastifyReply) {
  const ctx = getCtx(request, true)
  const data = await shopflowService.exportJson(ctx)
  return ok(data)
}

async function exportCsv(request: FastifyRequest<{ Querystring: { table?: string } }>, reply: FastifyReply) {
  const ctx = getCtx(request, true)
  const data = await shopflowService.exportCsv(ctx, request.query.table)
  return ok(data)
}

export function registerRoutes(fastify: FastifyInstance) {
  fastify.get('/api/shopflow/export/json', { preHandler: pre }, handle(exportJson))
  fastify.get('/api/shopflow/export/csv', { preHandler: pre }, handle(exportCsv))
}
