import type { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify'
import { validateBody } from '../../core/validate.js'
import { createInventoryTransferSchema } from '../../dto/shopflow.dto.js'
import { ok } from '../../common/api-response.js'
import * as shopflowService from '../../services/shopflow.service.js'
import { getCtx, handle, pre } from './_shared.js'

async function listInventoryTransfers(request: FastifyRequest<{ Querystring: { fromStoreId?: string; toStoreId?: string; productId?: string; status?: string; page?: string; limit?: string } }>, reply: FastifyReply) {
  const ctx = getCtx(request, true)
  const data = await shopflowService.listInventoryTransfers(ctx, request.query)
  return ok(data)
}

async function createInventoryTransfer(request: FastifyRequest, reply: FastifyReply) {
  const body = validateBody(createInventoryTransferSchema, request.body)
  const ctx = getCtx(request, true)
  const transfer = await shopflowService.createInventoryTransfer(ctx, body)
  return ok(transfer)
}

async function completeInventoryTransfer(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const ctx = getCtx(request, true)
  const transfer = await shopflowService.completeInventoryTransfer(ctx, request.params.id)
  return ok(transfer)
}

async function cancelInventoryTransfer(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const ctx = getCtx(request, true)
  const transfer = await shopflowService.cancelInventoryTransfer(ctx, request.params.id)
  return ok(transfer)
}

export function registerRoutes(fastify: FastifyInstance) {
  fastify.get('/api/shopflow/inventory-transfers', { preHandler: pre }, handle(listInventoryTransfers))
  fastify.post('/api/shopflow/inventory-transfers', { preHandler: pre }, handle(createInventoryTransfer))
  fastify.post<{ Params: { id: string } }>('/api/shopflow/inventory-transfers/:id/complete', { preHandler: pre }, handle(completeInventoryTransfer))
  fastify.post<{ Params: { id: string } }>('/api/shopflow/inventory-transfers/:id/cancel', { preHandler: pre }, handle(cancelInventoryTransfer))
}
