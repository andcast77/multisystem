import type { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify'
import { validateBody } from '../../core/validate.js'
import { createCategorySchema, updateCategorySchema } from '../../dto/shopflow.dto.js'
import { ok } from '../../common/api-response.js'
import * as shopflowService from '../../services/shopflow.service.js'
import { getCtx, handle, pre } from './_shared.js'

async function listCategories(
  request: FastifyRequest<{ Querystring: { search?: string; parentId?: string; includeChildren?: string } }>,
  reply: FastifyReply
) {
  const ctx = getCtx(request, true)
  const data = await shopflowService.listCategories(ctx, request.query)
  return ok(data)
}

async function getCategoryById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const ctx = getCtx(request, true)
  const data = await shopflowService.getCategoryById(ctx, request.params.id)
  return ok(data)
}

async function createCategory(request: FastifyRequest, reply: FastifyReply) {
  const body = validateBody(createCategorySchema, request.body)
  const ctx = getCtx(request, true)
  const data = await shopflowService.createCategory(ctx, body)
  return ok(data)
}

async function updateCategory(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const body = validateBody(updateCategorySchema, request.body)
  const ctx = getCtx(request, true)
  const data = await shopflowService.updateCategory(ctx, request.params.id, body)
  return ok(data)
}

async function deleteCategory(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const ctx = getCtx(request, true)
  await shopflowService.deleteCategory(ctx, request.params.id)
  return { success: true }
}

export function registerRoutes(fastify: FastifyInstance) {
  fastify.get('/api/shopflow/categories', { preHandler: pre }, handle(listCategories))
  fastify.get<{ Params: { id: string } }>('/api/shopflow/categories/:id', { preHandler: pre }, handle(getCategoryById))
  fastify.post('/api/shopflow/categories', { preHandler: pre }, handle(createCategory))
  fastify.put<{ Params: { id: string } }>('/api/shopflow/categories/:id', { preHandler: pre }, handle(updateCategory))
  fastify.delete<{ Params: { id: string } }>('/api/shopflow/categories/:id', { preHandler: pre }, handle(deleteCategory))
}
