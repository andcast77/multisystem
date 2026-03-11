import type { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify'
import { validateBody } from '../../core/validate.js'
import { createCustomerSchema, updateCustomerSchema } from '../../dto/shopflow.dto.js'
import { ok } from '../../common/api-response.js'
import * as shopflowService from '../../services/shopflow.service.js'
import { getCtx, handle, pre } from './_shared.js'

async function listCustomers(request: FastifyRequest<{ Querystring: { search?: string; email?: string; phone?: string } }>, reply: FastifyReply) {
  const ctx = getCtx(request, true)
  const data = await shopflowService.listCustomers(ctx, request.query)
  return ok(data)
}

async function getCustomerById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const ctx = getCtx(request, true)
  const data = await shopflowService.getCustomerById(ctx, request.params.id)
  return ok(data)
}

async function createCustomer(request: FastifyRequest, reply: FastifyReply) {
  const body = validateBody(createCustomerSchema, request.body)
  const ctx = getCtx(request, true)
  const data = await shopflowService.createCustomer(ctx, body)
  return ok(data)
}

async function updateCustomer(request: FastifyRequest<{ Params: { id: string }; Body: unknown }>, reply: FastifyReply) {
  const body = validateBody(updateCustomerSchema, request.body)
  const ctx = getCtx(request, true)
  const data = await shopflowService.updateCustomer(ctx, request.params.id, body)
  return ok(data)
}

async function deleteCustomer(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const ctx = getCtx(request, true)
  await shopflowService.deleteCustomer(ctx, request.params.id)
  return { success: true }
}

export function registerRoutes(fastify: FastifyInstance) {
  fastify.get('/api/shopflow/customers', { preHandler: pre }, handle(listCustomers))
  fastify.get<{ Params: { id: string } }>('/api/shopflow/customers/:id', { preHandler: pre }, handle(getCustomerById))
  fastify.post('/api/shopflow/customers', { preHandler: pre }, handle(createCustomer))
  fastify.put<{ Params: { id: string } }>('/api/shopflow/customers/:id', { preHandler: pre }, handle(updateCustomer))
  fastify.delete<{ Params: { id: string } }>('/api/shopflow/customers/:id', { preHandler: pre }, handle(deleteCustomer))
}
