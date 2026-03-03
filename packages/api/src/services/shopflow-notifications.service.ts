import type { FastifyReply } from 'fastify'
import { prisma, Prisma } from '../db/index.js'
import type { CompanyContext } from '../core/auth-context.js'

export type CreateNotificationBody = {
  userId: string
  type: string
  priority?: string
  title: string
  message: string
  data?: Record<string, unknown>
  actionUrl?: string
  expiresAt?: string
}

export async function createNotification(
  ctx: CompanyContext,
  body: CreateNotificationBody,
  reply: FastifyReply
): Promise<{ success: boolean; data?: unknown; error?: string; message?: string }> {
  const { userId, type, priority, title, message, data, actionUrl, expiresAt } = body
  if (!userId || !type || !title || !message) {
    reply.code(400)
    return { success: false, error: 'userId, type, title y message son requeridos' }
  }

  const notification = await prisma.notification.create({
    data: {
      userId,
      companyId: ctx.companyId,
      type: type as 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS' | 'SYSTEM',
      priority: (priority === 'LOW' || priority === 'MEDIUM' || priority === 'HIGH' ? priority : 'MEDIUM') as 'LOW' | 'MEDIUM' | 'HIGH',
      title,
      message,
      data: data != null ? (data as Prisma.InputJsonValue) : undefined,
      actionUrl: actionUrl ?? null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      status: 'UNREAD',
    },
  })
  return {
    success: true,
    data: { ...notification, data: notification.data ?? null },
  }
}

export type ListNotificationsQuery = {
  userId?: string
  type?: string
  status?: string
  priority?: string
  page?: string
  limit?: string
}

export async function listNotifications(
  ctx: CompanyContext,
  query: ListNotificationsQuery,
  reply: FastifyReply
): Promise<{ success: boolean; data?: unknown; error?: string; message?: string }> {
  const pageNum = parseInt(query.page ?? '1')
  const limitNum = parseInt(query.limit ?? '20')
  const skip = (pageNum - 1) * limitNum

  const where: Prisma.NotificationWhereInput = {
    companyId: ctx.companyId,
    OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
  }
  if (query.userId) where.userId = query.userId
  if (query.type) where.type = query.type as 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS' | 'SYSTEM'
  if (query.status) where.status = query.status as 'UNREAD' | 'READ'
  if (query.priority) where.priority = query.priority as 'LOW' | 'MEDIUM' | 'HIGH'

  const [total, results] = await Promise.all([
    prisma.notification.count({ where }),
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
    }),
  ])
  const notifications = results.map((row) => ({ ...row, data: row.data ?? null }))

  return {
    success: true,
    data: {
      notifications,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    },
  }
}

export async function markNotificationAsRead(
  ctx: CompanyContext,
  id: string,
  body: { userId: string },
  reply: FastifyReply
): Promise<{ success: boolean; data?: unknown; error?: string; message?: string }> {
  const { userId } = body
  if (!userId) {
    reply.code(400)
    return { success: false, error: 'userId es requerido' }
  }

  const existing = await prisma.notification.findFirst({
    where: { id, companyId: ctx.companyId },
    select: { id: true, userId: true },
  })
  if (!existing) {
    reply.code(404)
    return { success: false, error: 'Notificación no encontrada' }
  }
  if (existing.userId !== userId) {
    reply.code(403)
    return { success: false, error: 'Acceso denegado' }
  }
  await prisma.notification.update({
    where: { id },
    data: { status: 'READ', readAt: new Date() },
  })
  return { success: true, data: { success: true } }
}

export async function markNotificationAsUnread(
  ctx: CompanyContext,
  id: string,
  body: { userId: string },
  reply: FastifyReply
): Promise<{ success: boolean; data?: unknown; error?: string; message?: string }> {
  const { userId } = body
  if (!userId) {
    reply.code(400)
    return { success: false, error: 'userId es requerido' }
  }

  const existing = await prisma.notification.findFirst({
    where: { id, companyId: ctx.companyId },
    select: { id: true, userId: true },
  })
  if (!existing) {
    reply.code(404)
    return { success: false, error: 'Notificación no encontrada' }
  }
  if (existing.userId !== userId) {
    reply.code(403)
    return { success: false, error: 'Acceso denegado' }
  }
  await prisma.notification.update({
    where: { id },
    data: { status: 'UNREAD', readAt: null },
  })
  return { success: true, data: { success: true } }
}

export async function markAllNotificationsRead(
  ctx: CompanyContext,
  body: { userId: string },
  reply: FastifyReply
): Promise<{ success: boolean; data?: unknown; error?: string; message?: string }> {
  const { userId } = body
  if (!userId) {
    reply.code(400)
    return { success: false, error: 'userId es requerido' }
  }

  const result = await prisma.notification.updateMany({
    where: { userId, status: 'UNREAD' },
    data: { status: 'READ', readAt: new Date() },
  })
  return { success: true, data: { count: result.count } }
}

export async function deleteNotification(
  ctx: CompanyContext,
  id: string,
  body: { userId: string },
  reply: FastifyReply
): Promise<{ success: boolean; data?: unknown; error?: string; message?: string }> {
  const { userId } = body
  if (!userId) {
    reply.code(400)
    return { success: false, error: 'userId es requerido' }
  }

  const existing = await prisma.notification.findFirst({
    where: { id, companyId: ctx.companyId },
    select: { id: true, userId: true },
  })
  if (!existing) {
    reply.code(404)
    return { success: false, error: 'Notificación no encontrada' }
  }
  if (existing.userId !== userId) {
    reply.code(403)
    return { success: false, error: 'Acceso denegado' }
  }
  await prisma.notification.delete({ where: { id } })
  return { success: true, data: { success: true } }
}

export async function getUnreadCount(
  ctx: CompanyContext,
  query: { userId?: string },
  reply: FastifyReply
): Promise<{ success: boolean; data?: unknown; error?: string; message?: string }> {
  const { userId } = query
  if (!userId) {
    reply.code(400)
    return { success: false, error: 'userId es requerido' }
  }

  const count = await prisma.notification.count({
    where: {
      userId,
      status: 'UNREAD',
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  })
  return { success: true, data: { count } }
}

export async function getNotificationPreferences(
  ctx: CompanyContext,
  userId: string,
  reply: FastifyReply
): Promise<{ success: boolean; data?: unknown; error?: string; message?: string }> {
  let prefs = await prisma.notificationPreference.findUnique({
    where: { userId },
  })
  if (!prefs) {
    prefs = await prisma.notificationPreference.create({
      data: {
        userId,
        emailEnabled: true,
        inAppEnabled: true,
        pushEnabled: false,
      },
    })
  }
  return { success: true, data: prefs }
}
