import type { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify'
import { validateBody } from '../../core/validate.js'
import { createSaleSchema } from '../../dto/shopflow.dto.js'
import * as shopflowService from '../../services/shopflow.service.js'
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
  return shopflowService.createSale(ctx, body)
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
  fastify.get('/api/shopflow/sales', { preHandler: pre }, handle(listSales))
  fastify.get<{ Params: { id: string } }>('/api/shopflow/sales/:id', { preHandler: pre }, handle(getSaleById))
  fastify.post('/api/shopflow/sales', { preHandler: pre }, handle(createSale))
  fastify.post<{ Params: { id: string } }>('/api/shopflow/sales/:id/cancel', { preHandler: pre }, handle(cancelSale))
  fastify.post<{ Params: { id: string } }>('/api/shopflow/sales/:id/refund', { preHandler: pre }, handle(refundSale))
}
