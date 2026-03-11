import type { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify'
import { validateBody } from '../../core/validate.js'
import { createStoreSchema, updateStoreSchema } from '../../dto/shopflow.dto.js'
import { NotFoundError } from '../../common/errors/app-error.js'
import { ok } from '../../common/api-response.js'
import * as shopflowService from '../../services/shopflow.service.js'
import { getCtx, handle, pre } from './_shared.js'

async function listStores(
  request: FastifyRequest<{ Querystring: { includeInactive?: string } }>,
  reply: FastifyReply
) {
  const ctx = getCtx(request, true)
  const stores = await shopflowService.listStores(ctx, request.query.includeInactive)
  return ok(stores)
}

async function getStoreByCode(
  request: FastifyRequest<{ Params: { code: string } }>,
  reply: FastifyReply
) {
  const ctx = getCtx(request, true)
  const code = decodeURIComponent(request.params.code)
  const store = await shopflowService.getStoreByCode(ctx, code)
  if (!store) throw new NotFoundError('Tienda no encontrada')
  return ok(store)
}

async function getStoreById(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const ctx = getCtx(request, true)
  const store = await shopflowService.getStoreById(ctx, request.params.id)
  if (!store) throw new NotFoundError('Tienda no encontrada')
  return ok(store)
}

async function createStore(request: FastifyRequest, reply: FastifyReply) {
  const body = validateBody(createStoreSchema, request.body)
  const ctx = getCtx(request, true)
  const store = await shopflowService.createStore(ctx, body)
  return ok(store)
}

async function updateStore(request: FastifyRequest<{ Params: { id: string }; Body: unknown }>, reply: FastifyReply) {
  const body = validateBody(updateStoreSchema, request.body)
  const ctx = getCtx(request, true)
  const store = await shopflowService.updateStore(ctx, request.params.id, body)
  return ok(store)
}

async function deleteStore(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const ctx = getCtx(request, true)
  await shopflowService.deleteStore(ctx, request.params.id)
  return ok({ id: request.params.id })
}

export function registerRoutes(fastify: FastifyInstance) {
  fastify.get('/api/shopflow/stores', { preHandler: pre }, handle(listStores))
  fastify.get<{ Params: { code: string } }>('/api/shopflow/stores/by-code/:code', { preHandler: pre }, handle(getStoreByCode))
  fastify.get<{ Params: { id: string } }>('/api/shopflow/stores/:id', { preHandler: pre }, handle(getStoreById))
  fastify.post('/api/shopflow/stores', { preHandler: pre }, handle(createStore))
  fastify.put<{ Params: { id: string } }>('/api/shopflow/stores/:id', { preHandler: pre }, handle(updateStore))
  fastify.delete<{ Params: { id: string } }>('/api/shopflow/stores/:id', { preHandler: pre }, handle(deleteStore))
}
