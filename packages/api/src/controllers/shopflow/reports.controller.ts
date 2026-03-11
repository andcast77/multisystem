import type { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify'
import { ok } from '../../common/api-response.js'
import * as shopflowService from '../../services/shopflow.service.js'
import { getCtx, handle, pre } from './_shared.js'

async function getStats(
  request: FastifyRequest<{ Querystring: { storeId?: string; startDate?: string; endDate?: string } }>,
  reply: FastifyReply
) {
  const ctx = getCtx(request, true)
  const data = await shopflowService.getStats(ctx, request.query)
  return ok(data)
}

async function getDaily(
  request: FastifyRequest<{ Querystring: { storeId?: string; days?: string } }>,
  reply: FastifyReply
) {
  const ctx = getCtx(request, true)
  const data = await shopflowService.getDaily(ctx, request.query)
  return ok(data)
}

async function getTopProducts(
  request: FastifyRequest<{ Querystring: { storeId?: string; limit?: string; startDate?: string; endDate?: string; categoryId?: string } }>,
  reply: FastifyReply
) {
  const ctx = getCtx(request, true)
  const data = await shopflowService.getTopProducts(ctx, request.query)
  return ok(data)
}

async function getPaymentMethods(
  request: FastifyRequest<{ Querystring: { storeId?: string; startDate?: string; endDate?: string } }>,
  reply: FastifyReply
) {
  const ctx = getCtx(request, true)
  const data = await shopflowService.getPaymentMethods(ctx, request.query)
  return ok(data)
}

async function getInventoryReport(
  request: FastifyRequest<{ Querystring: { storeId?: string } }>,
  reply: FastifyReply
) {
  const ctx = getCtx(request, true)
  const data = await shopflowService.getInventory(ctx, request.query)
  return ok(data)
}

async function getTodayReport(
  request: FastifyRequest<{ Querystring: { storeId?: string } }>,
  reply: FastifyReply
) {
  const ctx = getCtx(request, true)
  const data = await shopflowService.getToday(ctx, request.query)
  return ok(data)
}

async function getWeekReport(
  request: FastifyRequest<{ Querystring: { storeId?: string } }>,
  reply: FastifyReply
) {
  const ctx = getCtx(request, true)
  const data = await shopflowService.getWeek(ctx, request.query)
  return ok(data)
}

async function getMonthReport(
  request: FastifyRequest<{ Querystring: { storeId?: string } }>,
  reply: FastifyReply
) {
  const ctx = getCtx(request, true)
  const data = await shopflowService.getMonth(ctx, request.query)
  return ok(data)
}

async function getReportByUser(
  request: FastifyRequest<{ Params: { userId: string }; Querystring: { startDate?: string; endDate?: string } }>,
  reply: FastifyReply
) {
  const ctx = getCtx(request, true)
  const data = await shopflowService.getByUser(ctx, request.params, request.query)
  return ok(data)
}

export function registerRoutes(fastify: FastifyInstance) {
  fastify.get('/api/shopflow/reports/stats', { preHandler: pre }, handle(getStats))
  fastify.get('/api/shopflow/reports/daily', { preHandler: pre }, handle(getDaily))
  fastify.get('/api/shopflow/reports/top-products', { preHandler: pre }, handle(getTopProducts))
  fastify.get('/api/shopflow/reports/payment-methods', { preHandler: pre }, handle(getPaymentMethods))
  fastify.get('/api/shopflow/reports/inventory', { preHandler: pre }, handle(getInventoryReport))
  fastify.get('/api/shopflow/reports/today', { preHandler: pre }, handle(getTodayReport))
  fastify.get('/api/shopflow/reports/week', { preHandler: pre }, handle(getWeekReport))
  fastify.get('/api/shopflow/reports/month', { preHandler: pre }, handle(getMonthReport))
  fastify.get<{ Params: { userId: string } }>('/api/shopflow/reports/by-user/:userId', { preHandler: pre }, handle(getReportByUser))
}
