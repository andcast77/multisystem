import type { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify'
import { validateBody } from '../../core/validate.js'
import { createSupplierSchema, updateSupplierSchema } from '../../dto/shopflow.dto.js'
import { ok } from '../../common/api-response.js'
import * as shopflowService from '../../services/shopflow.service.js'
import { getCtx, handle, pre } from './_shared.js'

async function listSuppliers(
  request: FastifyRequest<{ Querystring: { search?: string; active?: string } }>,
  reply: FastifyReply
) {
  const ctx = getCtx(request, true)
  const data = await shopflowService.listSuppliers(ctx, request.query)
  return ok(data)
}

async function getSupplierById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const ctx = getCtx(request, true)
  const data = await shopflowService.getSupplierById(ctx, request.params.id)
  return ok(data)
}

async function createSupplier(request: FastifyRequest, reply: FastifyReply) {
  const body = validateBody(createSupplierSchema, request.body)
  const ctx = getCtx(request, true)
  const data = await shopflowService.createSupplier(ctx, body)
  return ok(data)
}

async function updateSupplier(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const body = validateBody(updateSupplierSchema, request.body)
  const ctx = getCtx(request, true)
  const data = await shopflowService.updateSupplier(ctx, request.params.id, body)
  return ok(data)
}

async function deleteSupplier(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const ctx = getCtx(request, true)
  await shopflowService.deleteSupplier(ctx, request.params.id)
  return { success: true }
}

export function registerRoutes(fastify: FastifyInstance) {
  fastify.get('/api/shopflow/suppliers', { preHandler: pre }, handle(listSuppliers))
  fastify.get<{ Params: { id: string } }>('/api/shopflow/suppliers/:id', { preHandler: pre }, handle(getSupplierById))
  fastify.post('/api/shopflow/suppliers', { preHandler: pre }, handle(createSupplier))
  fastify.put<{ Params: { id: string } }>('/api/shopflow/suppliers/:id', { preHandler: pre }, handle(updateSupplier))
  fastify.delete<{ Params: { id: string } }>('/api/shopflow/suppliers/:id', { preHandler: pre }, handle(deleteSupplier))
}
