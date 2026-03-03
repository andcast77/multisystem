/**
 * Export helpers and handlers for shopflow (company-scoped data export).
 * Used by shopflow.service / shopflow.controller.
 * Uses Prisma findMany for all tables.
 */
import { prisma } from '../db/index.js'
import type { FastifyReply } from 'fastify'
import type { CompanyContext } from '../core/auth-context.js'

const ALLOWED_TABLES = [
  'users', 'customers', 'products', 'categories', 'suppliers', 'sales', 'saleItems',
  'stores', 'storeConfig', 'ticketConfig', 'userPreferences', 'actionHistory', 'notifications',
  'notificationPreferences', 'loyaltyConfig', 'loyaltyPoints', 'inventoryTransfers', 'pushSubscriptions',
] as const
type TableKey = (typeof ALLOWED_TABLES)[number]

async function getCompanyMemberUserIds(companyId: string): Promise<string[]> {
  const members = await prisma.companyMember.findMany({
    where: { companyId },
    select: { userId: true },
  })
  return members.map((m) => m.userId)
}

async function fetchTableData(table: TableKey, companyId: string): Promise<unknown[]> {
  const memberIds = await getCompanyMemberUserIds(companyId)
  switch (table) {
    case 'users':
      return memberIds.length ? await prisma.user.findMany({ where: { id: { in: memberIds } } }) : []
    case 'customers':
      return prisma.customer.findMany({ where: { companyId } })
    case 'products':
      return prisma.product.findMany({ where: { companyId } })
    case 'categories':
      return prisma.category.findMany({ where: { companyId } })
    case 'suppliers':
      return prisma.supplier.findMany({ where: { companyId } })
    case 'sales':
      return prisma.sale.findMany({ where: { companyId } })
    case 'saleItems':
      return prisma.saleItem.findMany({ where: { sale: { companyId } } })
    case 'stores':
      return prisma.store.findMany({ where: { companyId } })
    case 'storeConfig':
      return prisma.storeConfig.findMany({ where: { companyId } })
    case 'ticketConfig':
      return prisma.ticketConfig.findMany({ where: { companyId } })
    case 'userPreferences':
      return prisma.userPreferences.findMany({ where: { companyId } })
    case 'actionHistory':
      return prisma.actionHistory.findMany({ where: { companyId } })
    case 'notifications':
      return prisma.notification.findMany({ where: { companyId } })
    case 'notificationPreferences':
      return memberIds.length ? await prisma.notificationPreference.findMany({ where: { userId: { in: memberIds } } }) : []
    case 'loyaltyConfig':
      return prisma.loyaltyConfig.findMany({ where: { companyId } })
    case 'loyaltyPoints':
      return prisma.loyaltyPoint.findMany({ where: { companyId } })
    case 'inventoryTransfers':
      return prisma.inventoryTransfer.findMany({ where: { companyId } })
    case 'pushSubscriptions':
      if (memberIds.length === 0) return []
      return prisma.pushSubscription.findMany({ where: { userId: { in: memberIds } } })
    default:
      return []
  }
}

export async function exportJson(ctx: CompanyContext, reply: FastifyReply, _log: { warn: (a: unknown, b: string) => void }): Promise<{ success: boolean; data?: Record<string, unknown[]>; error?: string; message?: string }> {
  try {
    const data: Record<string, unknown[]> = {}
    for (const table of ALLOWED_TABLES) {
      try {
        data[table] = await fetchTableData(table, ctx.companyId)
      } catch {
        data[table] = []
      }
    }
    return { success: true, data }
  } catch (error) {
    reply.code(500)
    return { success: false, error: 'Error al exportar datos', message: error instanceof Error ? error.message : 'Error desconocido' }
  }
}

export async function exportCsv(
  ctx: CompanyContext,
  tableParam: string | undefined,
  reply: FastifyReply
): Promise<{ success: boolean; data?: { rows: unknown[]; headers: string[] }; error?: string; message?: string }> {
  try {
    if (!tableParam || typeof tableParam !== 'string') {
      reply.code(400)
      return { success: false, error: 'Query "table" es requerido' }
    }
    const safeTable = tableParam.trim() as TableKey
    if (!ALLOWED_TABLES.includes(safeTable)) {
      reply.code(400)
      return { success: false, error: `Tabla no permitida. Permitidas: ${ALLOWED_TABLES.join(', ')}` }
    }
    const rows = await fetchTableData(safeTable, ctx.companyId) as Record<string, unknown>[]
    const headers = rows.length > 0 ? Object.keys(rows[0]) : []
    return { success: true, data: { rows, headers } }
  } catch (error) {
    reply.code(500)
    return { success: false, error: 'Error al exportar tabla', message: error instanceof Error ? error.message : 'Error desconocido' }
  }
}
