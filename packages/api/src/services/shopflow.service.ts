import { Prisma, prisma } from '../db/index.js'
import type { CompanyContext, ShopflowContext } from '../core/auth-context.js'
import { canManageMembers } from '../core/permissions.js'
import * as productsService from './products.service.js'
import { NotFoundError, BadRequestError, ForbiddenError } from '../common/errors/app-error.js'
import { parsePagination } from '../common/database/index.js'
import { createRepositories } from '../repositories/index.js'

async function canAccessUserPreferences(callerId: string, callerIsSuperuser: boolean, companyId: string, callerMembershipRole: string | null, targetUserId: string): Promise<boolean> {
  if (callerId === targetUserId) return true
  if (callerIsSuperuser) return true
  if (!canManageMembers({ membershipRole: callerMembershipRole ?? undefined, isSuperuser: callerIsSuperuser })) return false
  return createRepositories(companyId).companyMembers.existsUserMembership(targetUserId)
}

export async function listProducts(ctx: CompanyContext, query: Record<string, string | undefined>) {
  return productsService.listProducts(ctx, query)
}

export async function getProductBySku(ctx: CompanyContext, sku: string) {
  return productsService.getProductBySku(ctx, sku)
}

export async function getProductByBarcode(ctx: CompanyContext, barcode: string) {
  return productsService.getProductByBarcode(ctx, barcode)
}

export async function getLowStock(ctx: CompanyContext, minStockThreshold?: number) {
  return productsService.getLowStock(ctx, minStockThreshold)
}

export async function getProductById(ctx: CompanyContext, id: string) {
  return productsService.getProductById(ctx, id)
}

export async function createProduct(ctx: CompanyContext, body: Parameters<typeof productsService.createProduct>[1]) {
  return productsService.createProduct(ctx, body)
}

export async function updateProduct(
  ctx: CompanyContext,
  id: string,
  body: Parameters<typeof productsService.updateProduct>[2]
) {
  return productsService.updateProduct(ctx, id, body)
}

export async function updateProductInventory(
  ctx: ShopflowContext,
  productId: string,
  payload: { stock: number; minStock?: number }
) {
  const product = await prisma.product.findFirst({
    where: { id: productId, companyId: ctx.companyId },
    select: { id: true },
  })
  if (!product) return null

  const storeId = ctx.storeId
  if (!storeId) throw new BadRequestError('storeId is required to update inventory (send X-Store-Id header)')

  await prisma.storeInventory.upsert({
    where: { storeId_productId: { storeId, productId } },
    create: {
      companyId: ctx.companyId,
      storeId,
      productId,
      quantity: payload.stock,
      minStock: payload.minStock ?? 0,
    },
    update: {
      quantity: payload.stock,
      ...(payload.minStock !== undefined ? { minStock: payload.minStock } : {}),
    },
  })

  return productsService.getProductById(ctx, productId)
}

export async function deleteProduct(ctx: CompanyContext, id: string) {
  return productsService.deleteProduct(ctx, id)
}

// --- Stores ---
export async function listStores(ctx: ShopflowContext, includeInactive?: string) {
  const hasFullStoreAccess = ctx.isSuperuser || ctx.membershipRole === 'OWNER' || ctx.membershipRole === 'ADMIN'
  return hasFullStoreAccess
    ? prisma.store.findMany({
        where: { companyId: ctx.companyId, ...(includeInactive !== 'true' ? { active: true } : {}) },
        orderBy: { name: 'asc' },
      })
    : prisma.store.findMany({
        where: { companyId: ctx.companyId, ...(includeInactive !== 'true' ? { active: true } : {}), userStores: { some: { userId: ctx.userId } } },
        orderBy: { name: 'asc' },
      })
}

export async function getStoreByCode(ctx: ShopflowContext, code: string) {
  const hasFullStoreAccess = ctx.isSuperuser || ctx.membershipRole === 'OWNER' || ctx.membershipRole === 'ADMIN'
  return hasFullStoreAccess
    ? prisma.store.findFirst({ where: { companyId: ctx.companyId, code } })
    : prisma.store.findFirst({ where: { companyId: ctx.companyId, code, userStores: { some: { userId: ctx.userId } } } })
}

export async function getStoreById(ctx: ShopflowContext, id: string) {
  const hasFullStoreAccess = ctx.isSuperuser || ctx.membershipRole === 'OWNER' || ctx.membershipRole === 'ADMIN'
  return hasFullStoreAccess
    ? prisma.store.findFirst({ where: { id, companyId: ctx.companyId } })
    : prisma.store.findFirst({ where: { id, companyId: ctx.companyId, userStores: { some: { userId: ctx.userId } } } })
}

export async function createStore(
  ctx: CompanyContext,
  body: { name: string; code: string; address?: string | null; phone?: string | null; email?: string | null; taxId?: string | null }
) {
  return prisma.store.create({
    data: {
      companyId: ctx.companyId,
      name: body.name,
      code: body.code,
      address: body.address ?? null,
      phone: body.phone ?? null,
      email: body.email ?? null,
      taxId: body.taxId ?? null,
    },
  })
}

export async function updateStore(
  ctx: CompanyContext,
  id: string,
  body: Partial<{ name: string; code: string; address: string | null; phone: string | null; email: string | null; taxId: string | null; active: boolean }>
) {
  const existing = await prisma.store.findFirst({ where: { id, companyId: ctx.companyId } })
  if (!existing) throw new NotFoundError('Local no encontrado')
  const updateData: Record<string, unknown> = {}
  if (body.name !== undefined) updateData.name = body.name
  if (body.code !== undefined) updateData.code = body.code
  if (body.address !== undefined) updateData.address = body.address
  if (body.phone !== undefined) updateData.phone = body.phone
  if (body.email !== undefined) updateData.email = body.email
  if (body.taxId !== undefined) updateData.taxId = body.taxId
  if (body.active !== undefined) updateData.active = body.active
  if (Object.keys(updateData).length === 0) return existing
  return prisma.store.update({ where: { id }, data: updateData })
}

export async function deleteStore(ctx: CompanyContext, id: string) {
  const existing = await prisma.store.findFirst({ where: { id, companyId: ctx.companyId } })
  if (!existing) throw new NotFoundError('Local no encontrado')
  await prisma.store.delete({ where: { id } })
}

// --- Store config ---
export async function getStoreConfig(ctx: CompanyContext) {
  let config = await prisma.storeConfig.findFirst({
    where: { companyId: ctx.companyId },
    orderBy: { createdAt: 'desc' },
  })
  if (!config) {
    config = await prisma.storeConfig.create({
      data: {
        companyId: ctx.companyId,
        name: 'My Store',
        currency: 'USD',
        taxRate: 0,
        lowStockAlert: 10,
        invoicePrefix: 'INV-',
        invoiceNumber: 1,
        allowSalesWithoutStock: false,
      },
    })
  }
  return config
}

export async function updateStoreConfig(ctx: CompanyContext, body: Record<string, unknown>) {
  let config = await prisma.storeConfig.findFirst({
    where: { companyId: ctx.companyId },
    orderBy: { createdAt: 'desc' },
  })
  if (!config) {
    config = await prisma.storeConfig.create({
      data: {
        companyId: ctx.companyId,
        name: (body.name as string) ?? 'My Store',
        address: (body.address as string) ?? null,
        phone: (body.phone as string) ?? null,
        email: (body.email as string) ?? null,
        taxId: (body.taxId as string) ?? null,
        currency: ((body.currency as string) ?? 'USD') as 'USD',
        taxRate: (body.taxRate as number) ?? 0,
        lowStockAlert: (body.lowStockAlert as number) ?? 10,
        invoicePrefix: (body.invoicePrefix as string) ?? 'INV-',
        invoiceNumber: 1,
        allowSalesWithoutStock: (body.allowSalesWithoutStock as boolean) ?? false,
      },
    })
    return config
  }
  const data: Prisma.StoreConfigUpdateInput = {}
  if (body.name !== undefined) data.name = body.name as string
  if (body.address !== undefined) data.address = body.address as string | null
  if (body.phone !== undefined) data.phone = body.phone as string | null
  if (body.email !== undefined) data.email = body.email as string | null
  if (body.taxId !== undefined) data.taxId = body.taxId as string | null
  if (body.currency !== undefined) data.currency = body.currency as string
  if (body.taxRate !== undefined) data.taxRate = body.taxRate as number
  if (body.lowStockAlert !== undefined) data.lowStockAlert = body.lowStockAlert as number
  if (body.invoicePrefix !== undefined) data.invoicePrefix = body.invoicePrefix as string
  if (body.allowSalesWithoutStock !== undefined) data.allowSalesWithoutStock = body.allowSalesWithoutStock as boolean
  if (Object.keys(data).length === 0) throw new BadRequestError('No hay campos para actualizar')
  return prisma.storeConfig.update({ where: { id: config.id }, data })
}

export async function nextInvoiceNumber(ctx: CompanyContext) {
  const config = await prisma.storeConfig.findFirst({
    where: { companyId: ctx.companyId },
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  })
  if (!config) throw new NotFoundError('Configuración de tienda no encontrada')
  const [result] = await prisma.$queryRaw<[{ invoicePrefix: string; invoiceNumber: number }]>(
    Prisma.sql`UPDATE store_configs SET "invoiceNumber" = "invoiceNumber" + 1, "updatedAt" = NOW() WHERE id = ${config.id} RETURNING "invoicePrefix", "invoiceNumber"`
  )
  return { invoiceNumber: `${result.invoicePrefix}${result.invoiceNumber.toString().padStart(6, '0')}` }
}

// --- Ticket config ---
export async function getTicketConfig(ctx: CompanyContext, storeId: string | undefined) {
  let config = await prisma.ticketConfig.findFirst({
    where: { companyId: ctx.companyId, storeId: storeId ?? null },
    orderBy: { createdAt: 'desc' },
  })
  if (!config) {
    config = await prisma.ticketConfig.create({
      data: {
        companyId: ctx.companyId,
        storeId: storeId ?? null,
        ticketType: 'TICKET',
        thermalWidth: 80,
        fontSize: 12,
        copies: 1,
        autoPrint: true,
      },
    })
  }
  return config
}

export async function updateTicketConfig(ctx: CompanyContext, storeId: string | undefined, body: Record<string, unknown>) {
  let config = await prisma.ticketConfig.findFirst({
    where: { companyId: ctx.companyId, storeId: storeId ?? null },
    orderBy: { createdAt: 'desc' },
  })
  if (!config) {
    config = await prisma.ticketConfig.create({
      data: {
        companyId: ctx.companyId,
        storeId: (body.storeId as string) ?? storeId ?? null,
        ticketType: ((body.ticketType as string) ?? 'TICKET') as 'TICKET',
        header: (body.header as string) ?? null,
        description: (body.description as string) ?? null,
        logoUrl: (body.logoUrl as string) ?? null,
        footer: (body.footer as string) ?? null,
        defaultPrinterName: (body.defaultPrinterName as string) ?? null,
        thermalWidth: (body.thermalWidth as number) ?? 80,
        fontSize: (body.fontSize as number) ?? 12,
        copies: (body.copies as number) ?? 1,
        autoPrint: (body.autoPrint as boolean) ?? true,
      },
    })
    return config
  }
  const data: Prisma.TicketConfigUpdateInput = {}
  if (body.storeId !== undefined) data.storeId = body.storeId as string | null
  if (body.ticketType !== undefined) {
    const v = body.ticketType as string
    if (['TICKET', 'INVOICE', 'RECEIPT'].includes(v)) data.ticketType = v as 'TICKET' | 'INVOICE' | 'RECEIPT'
  }
  if (body.header !== undefined) data.header = body.header as string | null
  if (body.description !== undefined) data.description = body.description as string | null
  if (body.logoUrl !== undefined) data.logoUrl = body.logoUrl as string | null
  if (body.footer !== undefined) data.footer = body.footer as string | null
  if (body.defaultPrinterName !== undefined) data.defaultPrinterName = body.defaultPrinterName as string | null
  if (body.thermalWidth !== undefined) data.thermalWidth = body.thermalWidth as number
  if (body.fontSize !== undefined) data.fontSize = body.fontSize as number
  if (body.copies !== undefined) data.copies = body.copies as number
  if (body.autoPrint !== undefined) data.autoPrint = body.autoPrint as boolean
  if (Object.keys(data).length === 0) return config
  return prisma.ticketConfig.update({ where: { id: config.id }, data })
}

// --- Loyalty ---
const num = (v: unknown) => (v == null ? 0 : typeof v === 'object' && 'toNumber' in (v as object) ? (v as { toNumber: () => number }).toNumber() : Number(v))

export async function getLoyaltyConfig(ctx: CompanyContext) {
  const config = await createRepositories(ctx.companyId).loyalty.findActiveConfig()
  if (!config) {
    return { pointsPerDollar: 1.0, redemptionRate: 0.01, pointsExpireMonths: undefined as number | undefined, minPurchaseForPoints: 0, maxPointsPerPurchase: undefined as number | undefined }
  }
  return {
    pointsPerDollar: num(config.pointsPerDollar),
    redemptionRate: num(config.redemptionRate),
    pointsExpireMonths: config.pointsExpireMonths ?? undefined,
    minPurchaseForPoints: num(config.minPurchaseForPoints),
    maxPointsPerPurchase: config.maxPointsPerPurchase != null ? num(config.maxPointsPerPurchase) : undefined,
  }
}

export async function updateLoyaltyConfig(ctx: CompanyContext, body: Record<string, unknown>) {
  const repos = createRepositories(ctx.companyId)
  const current = await repos.loyalty.findActiveConfig()
  const cur = current
    ? {
        pointsPerDollar: Number(current.pointsPerDollar),
        redemptionRate: Number(current.redemptionRate),
        pointsExpireMonths: current.pointsExpireMonths,
        minPurchaseForPoints: Number(current.minPurchaseForPoints),
        maxPointsPerPurchase: current.maxPointsPerPurchase,
      }
    : { pointsPerDollar: 1.0, redemptionRate: 0.01, pointsExpireMonths: null as number | null, minPurchaseForPoints: 0, maxPointsPerPurchase: null as number | null }
  const newConfig = await repos.loyalty.createConfig({
    pointsPerDollar: (body.pointsPerDollar as number) ?? cur.pointsPerDollar,
    redemptionRate: (body.redemptionRate as number) ?? cur.redemptionRate,
    pointsExpireMonths: (body.pointsExpireMonths as number) ?? cur.pointsExpireMonths,
    minPurchaseForPoints: (body.minPurchaseForPoints as number) ?? cur.minPurchaseForPoints,
    maxPointsPerPurchase: (body.maxPointsPerPurchase as number) ?? cur.maxPointsPerPurchase,
  })
  await repos.loyalty.deactivateOtherActiveConfigs(newConfig.id)
  return {
    pointsPerDollar: num(newConfig.pointsPerDollar),
    redemptionRate: num(newConfig.redemptionRate),
    pointsExpireMonths: newConfig.pointsExpireMonths ?? undefined,
    minPurchaseForPoints: num(newConfig.minPurchaseForPoints),
    maxPointsPerPurchase: newConfig.maxPointsPerPurchase != null ? num(newConfig.maxPointsPerPurchase) : undefined,
  }
}

export async function getCustomerPoints(ctx: CompanyContext, customerId: string) {
  const repos = createRepositories(ctx.companyId)
  const customer = await repos.customers.findById(customerId)
  if (!customer) throw new NotFoundError('Cliente no encontrado')

  const transactions = await repos.loyalty.findTransactionsByCustomerId(customerId)
  const now = new Date()
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  let totalPoints = 0
  let availablePoints = 0
  let expiringSoon = 0
  let lastActivity: Date | null = null
  for (const t of transactions) {
    const createdAt = new Date(t.createdAt)
    if (!lastActivity || createdAt > lastActivity) lastActivity = createdAt
    if (t.expiresAt && new Date(t.expiresAt) < now) continue
    const points = num(t.points) || 0
    totalPoints += points
    if (t.type !== 'REDEEMED') availablePoints += points
    if (t.expiresAt && new Date(t.expiresAt) <= thirtyDaysFromNow && new Date(t.expiresAt) > now && t.type !== 'REDEEMED') expiringSoon += points
  }
  return { customerId, customerName: customer.name, totalPoints: Math.max(0, totalPoints), availablePoints: Math.max(0, availablePoints), expiringSoon: Math.max(0, expiringSoon), lastActivity }
}

export async function awardLoyaltyPoints(ctx: CompanyContext, body: { customerId: string; purchaseAmount: number; saleId: string }) {
  const repos = createRepositories(ctx.companyId)
  const customer = await repos.customers.findById(body.customerId)
  if (!customer) throw new NotFoundError('Cliente no encontrado')

  const config = await repos.loyalty.findActiveConfig()
  if (!config) return { pointsAwarded: 0 }
  const minPurchase = num(config.minPurchaseForPoints) || 0
  if (body.purchaseAmount < minPurchase) return { pointsAwarded: 0 }
  let pointsToAward = Math.floor(body.purchaseAmount * num(config.pointsPerDollar))
  if (config.maxPointsPerPurchase != null) {
    const maxPoints = num(config.maxPointsPerPurchase)
    if (pointsToAward > maxPoints) pointsToAward = maxPoints
  }
  if (pointsToAward <= 0) return { pointsAwarded: 0 }
  let expiresAt: Date | null = null
  if (config.pointsExpireMonths != null) {
    expiresAt = new Date()
    expiresAt.setMonth(expiresAt.getMonth() + num(config.pointsExpireMonths))
  }
  const transaction = await repos.loyalty.createEarnedPoints({
    customerId: body.customerId,
    points: pointsToAward,
    description: `Points earned from purchase #${body.saleId}`,
    saleId: body.saleId,
    expiresAt,
  })
  return { pointsAwarded: Number(transaction.points) }
}

// --- Export ---
export { exportJson, exportCsv } from './shopflow-export.service.js'

// --- Categories ---
export { listCategories, getCategoryById, createCategory, updateCategory, deleteCategory } from './shopflow-categories.service.js'

// --- Suppliers ---
export { listSuppliers, getSupplierById, createSupplier, updateSupplier, deleteSupplier } from './shopflow-suppliers.service.js'

// --- Customers ---
export { listCustomers, getCustomerById, createCustomer, updateCustomer, deleteCustomer } from './shopflow-customers.service.js'
export { createAction, listActions } from './shopflow-action-history.service.js'

// --- Sales ---
export {
  listSales, getSaleById, createSale, cancelSale, refundSale,
  type Sale, type SaleItem, type ListSalesQuery, type CreateSaleBody,
} from './shopflow-sales.service.js'

// --- Reports ---
export {
  resolveEffectiveStoreIdForReport, getStats, getDaily, getTopProducts,
  getPaymentMethods, getInventory, getToday, getWeek, getMonth, getByUser,
} from './shopflow-reports.service.js'

// --- Notifications ---
export {
  createNotification, listNotifications, markNotificationAsRead, markNotificationAsUnread,
  markAllNotificationsRead, deleteNotification, getUnreadCount, getNotificationPreferences,
} from './shopflow-notifications.service.js'

// --- User preferences ---
export async function getUserPreferences(ctx: CompanyContext, userId: string) {
  const allowed = await canAccessUserPreferences(ctx.userId, ctx.isSuperuser, ctx.companyId, ctx.membershipRole, userId)
  if (!allowed) throw new ForbiddenError('No tienes acceso a las preferencias de este usuario')
  let preferences = await prisma.userPreferences.findUnique({
    where: { userId_companyId: { userId, companyId: ctx.companyId } },
  })
  if (!preferences) {
    preferences = await prisma.userPreferences.create({
      data: { userId, companyId: ctx.companyId, language: 'es' },
    })
  }
  return preferences
}

export async function updateUserPreferences(ctx: CompanyContext, userId: string, body: { language?: string }) {
  const allowed = await canAccessUserPreferences(ctx.userId, ctx.isSuperuser, ctx.companyId, ctx.membershipRole, userId)
  if (!allowed) throw new ForbiddenError('No tienes acceso a las preferencias de este usuario')
  let preferences = await prisma.userPreferences.findUnique({
    where: { userId_companyId: { userId, companyId: ctx.companyId } },
    select: { id: true },
  })
  if (!preferences) {
    return prisma.userPreferences.create({
      data: { userId, companyId: ctx.companyId, language: body.language ?? 'es' },
    })
  }
  if (body.language === undefined) throw new BadRequestError('No hay campos para actualizar')
  return prisma.userPreferences.update({
    where: { userId_companyId: { userId, companyId: ctx.companyId } },
    data: { language: body.language },
  })
}

// --- Push subscriptions ---
export async function listPushSubscriptions(ctx: ShopflowContext, userId: string) {
  if (userId !== ctx.userId) throw new ForbiddenError('Solo puedes ver tus propias suscripciones')
  const rows = await prisma.pushSubscription.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: { endpoint: true, p256dh: true, auth: true },
  })
  return rows.map((r) => ({ endpoint: r.endpoint, p256dh: r.p256dh, auth: r.auth }))
}

export async function createPushSubscription(ctx: ShopflowContext, body: { userId?: string; endpoint: string; p256dh: string; auth: string }) {
  const { userId: bodyUserId, endpoint, p256dh, auth } = body
  if (!endpoint || !p256dh || !auth) throw new BadRequestError('endpoint, p256dh y auth son requeridos')
  const userId = bodyUserId && bodyUserId === ctx.userId ? bodyUserId : ctx.userId
  const existing = await prisma.pushSubscription.findUnique({ where: { endpoint } })
  if (existing) {
    return prisma.pushSubscription.update({ where: { endpoint }, data: { userId, p256dh, auth } })
  }
  return prisma.pushSubscription.create({ data: { userId, endpoint, p256dh, auth } })
}

export async function deletePushSubscription(ctx: ShopflowContext, endpoint: string) {
  if (!endpoint) throw new BadRequestError('Query "endpoint" es requerido')
  const decoded = decodeURIComponent(endpoint)
  const existing = await prisma.pushSubscription.findUnique({ where: { endpoint: decoded } })
  if (!existing) throw new NotFoundError('Suscripción no encontrada')
  if (existing.userId !== ctx.userId) throw new ForbiddenError('Solo puedes eliminar tus propias suscripciones')
  await prisma.pushSubscription.delete({ where: { endpoint: decoded } })
}

// --- Inventory transfers ---
const TRANSFER_STATUSES = ['PENDING', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED'] as const

export async function listInventoryTransfers(
  ctx: CompanyContext,
  query: { fromStoreId?: string; toStoreId?: string; productId?: string; status?: string; page?: string; limit?: string },
) {
  const { page: pageNum, limit: limitNum, skip } = parsePagination(query)
  const where: Prisma.InventoryTransferWhereInput = { companyId: ctx.companyId }
  if (query.fromStoreId) where.fromStoreId = query.fromStoreId
  if (query.toStoreId) where.toStoreId = query.toStoreId
  if (query.productId) where.productId = query.productId
  if (query.status && TRANSFER_STATUSES.includes(query.status as (typeof TRANSFER_STATUSES)[number])) where.status = query.status as (typeof TRANSFER_STATUSES)[number]
  const [total, transfers] = await Promise.all([
    prisma.inventoryTransfer.count({ where }),
    prisma.inventoryTransfer.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limitNum }),
  ])
  return { transfers, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } }
}

export async function createInventoryTransfer(
  ctx: CompanyContext,
  body: { fromStoreId: string; toStoreId: string; productId: string; quantity: number; notes?: string | null; createdById: string },
) {
  const { fromStoreId, toStoreId, productId, quantity, notes, createdById } = body
  if (fromStoreId === toStoreId) throw new BadRequestError('Origen y destino no pueden ser la misma tienda')
  const product = await prisma.product.findFirst({
    where: { id: productId, companyId: ctx.companyId },
    select: { id: true },
  })
  if (!product) throw new NotFoundError('Producto no encontrado')

  const sourceInventory = await prisma.storeInventory.findUnique({
    where: { storeId_productId: { storeId: fromStoreId, productId } },
  })
  if (!sourceInventory || sourceInventory.quantity < quantity) {
    throw new BadRequestError('Stock insuficiente en el local de origen')
  }

  return prisma.inventoryTransfer.create({
    data: { companyId: ctx.companyId, fromStoreId, toStoreId, productId, quantity, notes: notes ?? null, status: 'PENDING', createdById },
  })
}

export async function completeInventoryTransfer(ctx: CompanyContext, id: string) {
  const existing = await prisma.inventoryTransfer.findFirst({
    where: { id, companyId: ctx.companyId },
    select: { id: true, status: true, productId: true, quantity: true, fromStoreId: true, toStoreId: true },
  })
  if (!existing) throw new NotFoundError('Transferencia no encontrada')
  if (existing.status !== 'PENDING' && existing.status !== 'IN_TRANSIT') {
    throw new BadRequestError('Solo se pueden completar transferencias pendientes')
  }

  await prisma.$transaction(async (tx) => {
    const source = await tx.storeInventory.findUnique({
      where: { storeId_productId: { storeId: existing.fromStoreId, productId: existing.productId } },
    })
    if (!source || source.quantity < existing.quantity) {
      throw new BadRequestError('Stock insuficiente en el local de origen para completar la transferencia')
    }

    await tx.storeInventory.update({
      where: { id: source.id },
      data: { quantity: { decrement: existing.quantity } },
    })

    await tx.storeInventory.upsert({
      where: { storeId_productId: { storeId: existing.toStoreId, productId: existing.productId } },
      create: {
        companyId: ctx.companyId,
        storeId: existing.toStoreId,
        productId: existing.productId,
        quantity: existing.quantity,
      },
      update: { quantity: { increment: existing.quantity } },
    })

    await tx.inventoryTransfer.update({
      where: { id },
      data: { status: 'COMPLETED', completedAt: new Date() },
    })
  })

  return prisma.inventoryTransfer.findFirstOrThrow({ where: { id, companyId: ctx.companyId } })
}

export async function cancelInventoryTransfer(ctx: CompanyContext, id: string) {
  const existing = await prisma.inventoryTransfer.findFirst({
    where: { id, companyId: ctx.companyId },
    select: { id: true, status: true },
  })
  if (!existing) throw new NotFoundError('Transferencia no encontrada')
  if (existing.status === 'COMPLETED') throw new BadRequestError('No se puede cancelar una transferencia completada')
  return prisma.inventoryTransfer.update({ where: { id }, data: { status: 'CANCELLED' } })
}
