import type { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify'
import { validateBody } from '../../core/validate.js'
import { updateStoreConfigSchema, updateTicketConfigSchema } from '../../dto/shopflow.dto.js'
import { ok } from '../../common/api-response.js'
import * as shopflowService from '../../services/shopflow.service.js'
import { getCtx, handle, pre } from './_shared.js'

async function getStoreConfig(request: FastifyRequest, reply: FastifyReply) {
  const ctx = getCtx(request, true)
  const config = await shopflowService.getStoreConfig(ctx)
  return ok(config)
}

async function updateStoreConfig(request: FastifyRequest, reply: FastifyReply) {
  const body = validateBody(updateStoreConfigSchema, request.body)
  const ctx = getCtx(request, true)
  const config = await shopflowService.updateStoreConfig(ctx, body)
  return ok(config)
}

async function nextInvoiceNumber(request: FastifyRequest, reply: FastifyReply) {
  const ctx = getCtx(request, true)
  const result = await shopflowService.nextInvoiceNumber(ctx)
  return ok(result)
}

async function getTicketConfig(request: FastifyRequest<{ Querystring: { storeId?: string } }>, reply: FastifyReply) {
  const ctx = getCtx(request, true)
  const config = await shopflowService.getTicketConfig(ctx, request.query.storeId)
  return ok(config)
}

async function updateTicketConfig(request: FastifyRequest<{ Querystring: { storeId?: string }; Body: unknown }>, reply: FastifyReply) {
  const body = validateBody(updateTicketConfigSchema, request.body)
  const ctx = getCtx(request, true)
  const config = await shopflowService.updateTicketConfig(ctx, request.query.storeId, body)
  return ok(config)
}

export function registerRoutes(fastify: FastifyInstance) {
  fastify.get('/api/shopflow/store-config', { preHandler: pre }, handle(getStoreConfig))
  fastify.put('/api/shopflow/store-config', { preHandler: pre }, handle(updateStoreConfig))
  fastify.post('/api/shopflow/store-config/next-invoice-number', { preHandler: pre }, handle(nextInvoiceNumber))
  fastify.get('/api/shopflow/ticket-config', { preHandler: pre }, handle(getTicketConfig))
  fastify.put('/api/shopflow/ticket-config', { preHandler: pre }, handle(updateTicketConfig))
}
