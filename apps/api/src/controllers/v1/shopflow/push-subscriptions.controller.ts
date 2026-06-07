import type { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify'
import { validateBody } from '../../../core/validate.js'
import { createPushSubscriptionSchema } from '../../../dto/shopflow.dto.js'
import { ok } from '../../../common/api-response.js'
import * as shopflowService from '../../../services/shopflow.service.js'
import { getCtx, handle, pre } from './_shared.js'

async function listPushSubscriptions(request: FastifyRequest<{ Params: { userId: string } }>, reply: FastifyReply) {
  const ctx = getCtx(request, true)
  const data = await shopflowService.listPushSubscriptions(ctx, request.params.userId)
  return ok(data)
}

async function createPushSubscription(request: FastifyRequest, reply: FastifyReply) {
  const body = validateBody(createPushSubscriptionSchema, request.body)
  const ctx = getCtx(request, true)
  const sub = await shopflowService.createPushSubscription(ctx, body)
  return ok(sub)
}

async function deletePushSubscription(request: FastifyRequest<{ Querystring: { endpoint?: string } }>, reply: FastifyReply) {
  const ctx = getCtx(request, true)
  await shopflowService.deletePushSubscription(ctx, request.query.endpoint ?? '')
  return { success: true }
}

export function registerRoutes(fastify: FastifyInstance) {
  fastify.get<{ Params: { userId: string } }>('/v1/shopflow/users/:userId/push-subscriptions', { preHandler: pre }, handle(listPushSubscriptions))
  fastify.post('/v1/shopflow/push-subscriptions', { preHandler: pre }, handle(createPushSubscription))
  fastify.delete('/v1/shopflow/push-subscriptions', { preHandler: pre }, handle(deletePushSubscription))
}
