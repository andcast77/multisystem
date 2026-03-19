import { prisma, Prisma } from '../db/index.js'
import type { CompanyContext } from '../core/auth-context.js'
import { NotFoundError, BadRequestError, ForbiddenError } from '../common/errors/app-error.js'
import { parsePagination } from '../common/database/index.js'

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

export async function createNotification(ctx: CompanyContext, body: CreateNotificationBody) {
  const { userId, type, priority, title, message, data, actionUrl, expiresAt } = body
  if (!userId || !type || !title || !message) {
    throw new BadRequestError('userId, type, title y message son requeridos')
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
  return { ...notification, data: notification.data ?? null }
}

export type ListNotificationsQuery = {
  userId?: string
  type?: string
  status?: string
  priority?: string
  page?: string
  limit?: string
}

export async function listNotifications(ctx: CompanyContext, query: ListNotificationsQuery) {
  const { page: pageNum, limit: limitNum, skip } = parsePagination(query)

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
    notifications,
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  }
}

export async function markNotificationAsRead(ctx: CompanyContext, id: string, body: { userId: string }) {
  const { userId } = body
  if (!userId) throw new BadRequestError('userId es requerido')

  const existing = await prisma.notification.findFirst({
    where: { id, companyId: ctx.companyId },
    select: { id: true, userId: true },
  })
  if (!existing) throw new NotFoundError('Notificación no encontrada')
  if (existing.userId !== userId) throw new ForbiddenError('Acceso denegado')

  await prisma.notification.update({
    where: { id },
    data: { status: 'READ', readAt: new Date() },
  })
}

export async function markNotificationAsUnread(ctx: CompanyContext, id: string, body: { userId: string }) {
  const { userId } = body
  if (!userId) throw new BadRequestError('userId es requerido')

  const existing = await prisma.notification.findFirst({
    where: { id, companyId: ctx.companyId },
    select: { id: true, userId: true },
  })
  if (!existing) throw new NotFoundError('Notificación no encontrada')
  if (existing.userId !== userId) throw new ForbiddenError('Acceso denegado')

  await prisma.notification.update({
    where: { id },
    data: { status: 'UNREAD', readAt: null },
  })
}

export async function markAllNotificationsRead(ctx: CompanyContext, body: { userId: string }) {
  const { userId } = body
  if (!userId) throw new BadRequestError('userId es requerido')

  const result = await prisma.notification.updateMany({
    where: { userId, status: 'UNREAD' },
    data: { status: 'READ', readAt: new Date() },
  })
  return { count: result.count }
}

export async function deleteNotification(ctx: CompanyContext, id: string, body: { userId: string }) {
  const { userId } = body
  if (!userId) throw new BadRequestError('userId es requerido')

  const existing = await prisma.notification.findFirst({
    where: { id, companyId: ctx.companyId },
    select: { id: true, userId: true },
  })
  if (!existing) throw new NotFoundError('Notificación no encontrada')
  if (existing.userId !== userId) throw new ForbiddenError('Acceso denegado')

  await prisma.notification.delete({ where: { id } })
}

export async function getUnreadCount(ctx: CompanyContext, query: { userId?: string }) {
  const { userId } = query
  if (!userId) throw new BadRequestError('userId es requerido')

  const count = await prisma.notification.count({
    where: {
      userId,
      status: 'UNREAD',
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  })
  return { count }
}

export async function getNotificationPreferences(ctx: CompanyContext, userId: string) {
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
  return prefs
}
