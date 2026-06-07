import type { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify'
import { validateBody } from '../../../core/validate.js'
import { updateLoyaltyConfigSchema, awardLoyaltyPointsSchema } from '../../../dto/shopflow.dto.js'
import { ok } from '../../../common/api-response.js'
import * as shopflowService from '../../../services/shopflow.service.js'
import { getCtx, handle, pre } from './_shared.js'

async function getLoyaltyConfig(request: FastifyRequest, reply: FastifyReply) {
  const ctx = getCtx(request, false)
  const config = await shopflowService.getLoyaltyConfig(ctx)
  return ok(config)
}

async function updateLoyaltyConfig(request: FastifyRequest, reply: FastifyReply) {
  const body = validateBody(updateLoyaltyConfigSchema, request.body)
  const ctx = getCtx(request, false)
  const config = await shopflowService.updateLoyaltyConfig(ctx, body)
  return ok(config)
}

async function getCustomerPoints(request: FastifyRequest<{ Params: { customerId: string } }>, reply: FastifyReply) {
  const ctx = getCtx(request, true)
  const data = await shopflowService.getCustomerPoints(ctx, request.params.customerId)
  return ok(data)
}

async function awardLoyaltyPoints(request: FastifyRequest, reply: FastifyReply) {
  const body = validateBody(awardLoyaltyPointsSchema, request.body)
  const ctx = getCtx(request, true)
  const data = await shopflowService.awardLoyaltyPoints(ctx, body)
  return ok(data)
}

export function registerRoutes(fastify: FastifyInstance) {
  fastify.get('/v1/shopflow/loyalty/config', { preHandler: pre }, handle(getLoyaltyConfig))
  fastify.put('/v1/shopflow/loyalty/config', { preHandler: pre }, handle(updateLoyaltyConfig))
  fastify.get<{ Params: { customerId: string } }>('/v1/shopflow/loyalty/points/:customerId', { preHandler: pre }, handle(getCustomerPoints))
  fastify.post('/v1/shopflow/loyalty/points/award', { preHandler: pre }, handle(awardLoyaltyPoints))
}
