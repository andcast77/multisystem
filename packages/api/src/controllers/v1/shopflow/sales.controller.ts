import type { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify'
import { validateBody } from '../../../core/validate.js'
import { createSaleSchema } from '../../../dto/shopflow.dto.js'
import * as shopflowService from '../../../services/shopflow.service.js'
import { sseManager } from '../../../services/sse.service.js'
import { getCtx, handle, pre } from './_shared.js'

async function listSales(
  request: FastifyRequest<{
    Querystring: { storeId?: string; customerId?: string; userId?: string; status?: string; paymentMethod?: string; startDate?: string; endDate?: string; page?: string; limit?: string }
  }>,
  reply: FastifyReply
) {
  const ctx = getCtx(request, true)
  return shopflowService.listSales(ctx, request.query)
}

async function getSaleById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const ctx = getCtx(request, true)
  return shopflowService.getSaleById(ctx, request.params.id)
}

async function createSale(request: FastifyRequest, reply: FastifyReply) {
  const body = validateBody(createSaleSchema, request.body)
  const ctx = getCtx(request, true)
  const result = await shopflowService.createSale(ctx, body)
  sseManager.emit(ctx.companyId, 'sale:created', { companyId: ctx.companyId, storeId: request.storeId ?? null })
  return result
}

async function cancelSale(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const ctx = getCtx(request, true)
  return shopflowService.cancelSale(ctx, request.params.id)
}

async function refundSale(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const ctx = getCtx(request, true)
  return shopflowService.refundSale(ctx, request.params.id)
}

export function registerRoutes(fastify: FastifyInstance) {
  fastify.get('/v1/shopflow/sales', { preHandler: pre }, handle(listSales))
  fastify.get<{ Params: { id: string } }>('/v1/shopflow/sales/:id', { preHandler: pre }, handle(getSaleById))
  fastify.post('/v1/shopflow/sales', { preHandler: pre }, handle(createSale))
  fastify.post<{ Params: { id: string } }>('/v1/shopflow/sales/:id/cancel', { preHandler: pre }, handle(cancelSale))
  fastify.post<{ Params: { id: string } }>('/v1/shopflow/sales/:id/refund', { preHandler: pre }, handle(refundSale))
}
