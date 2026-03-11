import type { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify'
import { validateBody } from '../../core/validate.js'
import { createNotificationSchema, notificationUserSchema } from '../../dto/shopflow.dto.js'
import { ok } from '../../common/api-response.js'
import * as shopflowService from '../../services/shopflow.service.js'
import { getCtx, handle, pre } from './_shared.js'

async function createNotification(request: FastifyRequest, reply: FastifyReply) {
  const body = validateBody(createNotificationSchema, request.body)
  const ctx = getCtx(request, true)
  const data = await shopflowService.createNotification(ctx, body)
  return ok(data)
}

async function listNotifications(
  request: FastifyRequest<{ Querystring: { userId?: string; type?: string; status?: string; priority?: string; page?: string; limit?: string } }>,
  reply: FastifyReply
) {
  const ctx = getCtx(request, true)
  const data = await shopflowService.listNotifications(ctx, request.query)
  return ok(data)
}

async function markNotificationAsRead(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const body = validateBody(notificationUserSchema, request.body)
  const ctx = getCtx(request, true)
  await shopflowService.markNotificationAsRead(ctx, request.params.id, body)
  return { success: true }
}

async function markNotificationAsUnread(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const body = validateBody(notificationUserSchema, request.body)
  const ctx = getCtx(request, true)
  await shopflowService.markNotificationAsUnread(ctx, request.params.id, body)
  return { success: true }
}

async function markAllNotificationsRead(request: FastifyRequest, reply: FastifyReply) {
  const body = validateBody(notificationUserSchema, request.body)
  const ctx = getCtx(request, true)
  const data = await shopflowService.markAllNotificationsRead(ctx, body)
  return ok(data)
}

async function deleteNotification(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const body = validateBody(notificationUserSchema, request.body)
  const ctx = getCtx(request, true)
  await shopflowService.deleteNotification(ctx, request.params.id, body)
  return { success: true }
}

async function getUnreadNotificationCount(
  request: FastifyRequest<{ Querystring: { userId: string } }>,
  reply: FastifyReply
) {
  const ctx = getCtx(request, true)
  const data = await shopflowService.getUnreadCount(ctx, request.query)
  return ok(data)
}

async function getNotificationPreferences(request: FastifyRequest<{ Params: { userId: string } }>, reply: FastifyReply) {
  const ctx = getCtx(request, true)
  const data = await shopflowService.getNotificationPreferences(ctx, request.params.userId)
  return ok(data)
}

export function registerRoutes(fastify: FastifyInstance) {
  fastify.post('/api/shopflow/notifications', { preHandler: pre }, handle(createNotification))
  fastify.get('/api/shopflow/notifications', { preHandler: pre }, handle(listNotifications))
  fastify.put<{ Params: { id: string } }>('/api/shopflow/notifications/:id/read', { preHandler: pre }, handle(markNotificationAsRead))
  fastify.put<{ Params: { id: string } }>('/api/shopflow/notifications/:id/unread', { preHandler: pre }, handle(markNotificationAsUnread))
  fastify.put('/api/shopflow/notifications/read-all', { preHandler: pre }, handle(markAllNotificationsRead))
  fastify.delete<{ Params: { id: string } }>('/api/shopflow/notifications/:id', { preHandler: pre }, handle(deleteNotification))
  fastify.get<{ Querystring: { userId: string } }>('/api/shopflow/notifications/unread-count', { preHandler: pre }, handle(getUnreadNotificationCount))
  fastify.get<{ Params: { userId: string } }>('/api/shopflow/notifications/preferences/:userId', { preHandler: pre }, handle(getNotificationPreferences))
  fastify.get<{ Params: { userId: string } }>('/api/shopflow/users/:userId/notification-preferences', { preHandler: pre }, handle(getNotificationPreferences))
}
