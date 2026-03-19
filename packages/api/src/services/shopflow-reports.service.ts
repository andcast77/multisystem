import { Prisma, prisma } from '../db/index.js'
import type { ShopflowContext } from '../core/auth-context.js'
import { ForbiddenError, NotFoundError } from '../common/errors/app-error.js'

const STORE_REQUIRED_MSG = 'Envía el parámetro storeId (query) o el header X-Store-Id con el id del local de venta para ver reportes (usuario no administrador)'

export async function resolveEffectiveStoreIdForReport(
  ctx: ShopflowContext,
  queryStoreId?: string
): Promise<string | undefined> {
  const isStoreAdmin = ctx.membershipRole === 'OWNER' || ctx.membershipRole === 'ADMIN' || ctx.isSuperuser
  if (isStoreAdmin) return queryStoreId ?? undefined
  const fromCtx = ctx.storeId ?? queryStoreId
  if (fromCtx) return fromCtx

  const store = await prisma.store.findFirst({
    where: {
      companyId: ctx.companyId,
      active: true,
      userStores: { some: { userId: ctx.userId } },
    },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  })
  if (!store) throw new ForbiddenError(STORE_REQUIRED_MSG)
  return store.id
}

function buildDateFilter(startDate?: string, endDate?: string): Prisma.SaleWhereInput['createdAt'] {
  if (startDate && endDate) return { gte: new Date(startDate), lte: new Date(endDate) }
  if (startDate) return { gte: new Date(startDate) }
  if (endDate) return { lte: new Date(endDate) }
  return undefined
}

export async function getStats(
  ctx: ShopflowContext,
  query: { storeId?: string; startDate?: string; endDate?: string },
) {
  const effectiveStoreId = await resolveEffectiveStoreIdForReport(ctx, query.storeId)
  const where: Prisma.SaleWhereInput = { companyId: ctx.companyId, status: 'COMPLETED' }
  if (effectiveStoreId !== undefined) where.storeId = effectiveStoreId
  const dateFilter = buildDateFilter(query.startDate, query.endDate)
  if (dateFilter) where.createdAt = dateFilter

  const agg = await prisma.sale.aggregate({ where, _count: true, _sum: { total: true, tax: true, discount: true } })
  const salesCount = agg._count
  const totalRevenue = Number(agg._sum.total ?? 0)
  const totalTax = Number(agg._sum.tax ?? 0)
  const totalDiscount = Number(agg._sum.discount ?? 0)
  const averageSale = salesCount > 0 ? totalRevenue / salesCount : 0

  return { totalSales: salesCount, totalRevenue, totalTax, totalDiscount, averageSale, salesCount }
}

export async function getDaily(
  ctx: ShopflowContext,
  query: { storeId?: string; days?: string },
) {
  const effectiveStoreId = await resolveEffectiveStoreIdForReport(ctx, query.storeId)
  const days = parseInt(query.days || '30')
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - (days - 1))
  startDate.setHours(0, 0, 0, 0)

  const sales = await prisma.$queryRaw<Array<{ date: Date; sales: bigint; revenue: unknown }>>(
    effectiveStoreId !== undefined
      ? Prisma.sql`
          SELECT DATE("createdAt") as date, COUNT(*)::bigint as sales, COALESCE(SUM(total), 0) as revenue
          FROM sales
          WHERE "companyId" = ${ctx.companyId} AND status = 'COMPLETED' AND "createdAt" >= ${startDate}
            AND "storeId" IS NOT DISTINCT FROM ${effectiveStoreId}
          GROUP BY DATE("createdAt")
          ORDER BY date ASC
        `
      : Prisma.sql`
          SELECT DATE("createdAt") as date, COUNT(*)::bigint as sales, COALESCE(SUM(total), 0) as revenue
          FROM sales
          WHERE "companyId" = ${ctx.companyId} AND status = 'COMPLETED' AND "createdAt" >= ${startDate}
          GROUP BY DATE("createdAt")
          ORDER BY date ASC
        `
  )
  const salesMap = new Map<string, { sales: number; revenue: number }>()
  sales.forEach((s) => {
    const dateStr = (s.date as Date).toISOString().split('T')[0]
    salesMap.set(dateStr, { sales: Number(s.sales), revenue: Number(s.revenue) })
  })
  const result: { date: string; sales: number; revenue: number }[] = []
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)
    const dateStr = date.toISOString().split('T')[0]
    const data = salesMap.get(dateStr) || { sales: 0, revenue: 0 }
    result.push({ date: dateStr, sales: data.sales, revenue: data.revenue })
  }
  return result
}

export async function getTopProducts(
  ctx: ShopflowContext,
  query: { storeId?: string; limit?: string; startDate?: string; endDate?: string; categoryId?: string },
) {
  const effectiveStoreId = await resolveEffectiveStoreIdForReport(ctx, query.storeId)
  const requestedLimit = parseInt(query.limit || '10', 10)
  const limit = Math.min(50, Math.max(1, isNaN(requestedLimit) ? 10 : requestedLimit))

  const whereSale: Prisma.SaleWhereInput = { companyId: ctx.companyId, status: 'COMPLETED' }
  if (effectiveStoreId !== undefined) whereSale.storeId = effectiveStoreId
  const dateFilter = buildDateFilter(query.startDate, query.endDate)
  if (dateFilter) whereSale.createdAt = dateFilter

  const saleIds = (await prisma.sale.findMany({ where: whereSale, select: { id: true } })).map((s) => s.id)
  if (saleIds.length === 0) return []

  const items = await prisma.saleItem.findMany({
    where: {
      saleId: { in: saleIds },
      ...(query.categoryId ? { product: { categoryId: query.categoryId } } : {}),
    },
    include: { product: { select: { id: true, name: true } } },
  })
  const byProduct = new Map<string, { productName: string; quantity: number; revenue: number; salesCount: Set<string> }>()
  for (const item of items) {
    const id = item.productId
    const cur = byProduct.get(id)
    const rev = Number(item.subtotal)
    if (!cur) {
      byProduct.set(id, { productName: item.product.name, quantity: item.quantity, revenue: rev, salesCount: new Set([item.saleId]) })
    } else {
      cur.quantity += item.quantity
      cur.revenue += rev
      cur.salesCount.add(item.saleId)
    }
  }
  return Array.from(byProduct.entries())
    .map(([productId, v]) => ({
      productId, productName: v.productName, quantity: v.quantity, revenue: v.revenue, salesCount: v.salesCount.size,
    }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, limit)
}

export async function getPaymentMethods(
  ctx: ShopflowContext,
  query: { storeId?: string; startDate?: string; endDate?: string },
) {
  const effectiveStoreId = await resolveEffectiveStoreIdForReport(ctx, query.storeId)

  const where: Prisma.SaleWhereInput = { companyId: ctx.companyId, status: 'COMPLETED' }
  if (effectiveStoreId !== undefined) where.storeId = effectiveStoreId
  const dateFilter = buildDateFilter(query.startDate, query.endDate)
  if (dateFilter) where.createdAt = dateFilter

  const results = await prisma.sale.groupBy({
    by: ['paymentMethod'],
    where,
    _count: true,
    _sum: { total: true },
  })
  return results
    .filter((r) => r.paymentMethod != null)
    .map((r) => ({ paymentMethod: r.paymentMethod!, count: r._count, total: Number(r._sum.total ?? 0) }))
}

export async function getInventory(
  ctx: ShopflowContext,
  query: { storeId?: string },
) {
  const effectiveStoreId = await resolveEffectiveStoreIdForReport(ctx, query.storeId)

  const storeCond = effectiveStoreId !== undefined
    ? Prisma.sql`AND si."storeId" = ${effectiveStoreId}`
    : Prisma.sql``

  const [productsRaw, statsRaw] = await Promise.all([
    prisma.$queryRaw<{ id: string; name: string; stock: number; minStock: number; price: number; cost: number }[]>(
      Prisma.sql`
        SELECT p.id, p.name, COALESCE(SUM(si.quantity), 0)::int as stock,
          COALESCE(MIN(si."minStock"), 0)::int as "minStock",
          p.price::float8 as price, COALESCE(p.cost::float8, 0) as cost
        FROM products p
        LEFT JOIN store_inventory si ON si."productId" = p.id ${storeCond}
        WHERE p."companyId" = ${ctx.companyId} AND p.active = true
        GROUP BY p.id
        ORDER BY COALESCE(SUM(si.quantity), 0) ASC
        LIMIT 10
      `
    ),
    prisma.$queryRaw<
      [
        {
          total: bigint
          lowStock: bigint
          outOfStock: bigint
          totalValue: number
          totalRetailValue: number
          totalStockUnits: bigint
        },
      ]
    >(
      Prisma.sql`
        SELECT
          COUNT(DISTINCT p.id)::bigint as total,
          COUNT(DISTINCT CASE WHEN COALESCE(agg.qty, 0) <= COALESCE(agg.min_s, 0) THEN p.id END)::bigint as "lowStock",
          COUNT(DISTINCT CASE WHEN COALESCE(agg.qty, 0) = 0 THEN p.id END)::bigint as "outOfStock",
          COALESCE(SUM(COALESCE(agg.qty, 0) * COALESCE(p.cost, 0))::float8, 0) as "totalValue",
          COALESCE(SUM(COALESCE(agg.qty, 0) * p.price)::float8, 0) as "totalRetailValue",
          COALESCE(SUM(COALESCE(agg.qty, 0))::int, 0) as "totalStockUnits"
        FROM products p
        LEFT JOIN (
          SELECT "productId", SUM(quantity)::int as qty, MIN("minStock")::int as min_s
          FROM store_inventory
          WHERE "companyId" = ${ctx.companyId} ${storeCond}
          GROUP BY "productId"
        ) agg ON agg."productId" = p.id
        WHERE p."companyId" = ${ctx.companyId} AND p.active = true
      `
    ),
  ])

  const stats = statsRaw[0]

  return {
    totalProducts: Number(stats?.total ?? 0),
    lowStockProducts: Number(stats?.lowStock ?? 0),
    outOfStockProducts: Number(stats?.outOfStock ?? 0),
    totalValue: stats?.totalValue ?? 0,
    totalRetailValue: stats?.totalRetailValue ?? 0,
    totalStockUnits: Number(stats?.totalStockUnits ?? 0),
    products: productsRaw.map((p) => ({
      id: p.id,
      name: p.name,
      stock: p.stock,
      minStock: p.minStock,
      price: p.price,
      value: p.stock * p.cost,
    })),
  }
}

function buildPeriodAgg(ctx: ShopflowContext, effectiveStoreId: string | undefined, start: Date, end: Date) {
  const where: Prisma.SaleWhereInput = {
    companyId: ctx.companyId,
    status: 'COMPLETED',
    createdAt: { gte: start, lte: end },
  }
  if (effectiveStoreId !== undefined) where.storeId = effectiveStoreId
  return where
}

async function aggregatePeriod(ctx: ShopflowContext, effectiveStoreId: string | undefined, start: Date, end: Date) {
  const where = buildPeriodAgg(ctx, effectiveStoreId, start, end)
  const agg = await prisma.sale.aggregate({ where, _count: true, _sum: { total: true, tax: true, discount: true } })
  const salesCount = agg._count
  const totalRevenue = Number(agg._sum.total ?? 0)
  return {
    totalSales: salesCount,
    totalRevenue,
    totalTax: Number(agg._sum.tax ?? 0),
    totalDiscount: Number(agg._sum.discount ?? 0),
    averageSale: salesCount > 0 ? totalRevenue / salesCount : 0,
    salesCount,
  }
}

export async function getToday(ctx: ShopflowContext, query: { storeId?: string }) {
  const effectiveStoreId = await resolveEffectiveStoreIdForReport(ctx, query.storeId)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const endOfDay = new Date(today)
  endOfDay.setHours(23, 59, 59, 999)
  return aggregatePeriod(ctx, effectiveStoreId, today, endOfDay)
}

export async function getWeek(ctx: ShopflowContext, query: { storeId?: string }) {
  const effectiveStoreId = await resolveEffectiveStoreIdForReport(ctx, query.storeId)
  const today = new Date()
  const dayOfWeek = today.getDay()
  const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
  const startOfWeek = new Date(today.setDate(diff))
  startOfWeek.setHours(0, 0, 0, 0)
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(endOfWeek.getDate() + 6)
  endOfWeek.setHours(23, 59, 59, 999)
  return aggregatePeriod(ctx, startOfWeek === undefined ? undefined : effectiveStoreId, startOfWeek, endOfWeek)
}

export async function getMonth(ctx: ShopflowContext, query: { storeId?: string }) {
  const effectiveStoreId = await resolveEffectiveStoreIdForReport(ctx, query.storeId)
  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  startOfMonth.setHours(0, 0, 0, 0)
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
  endOfMonth.setHours(23, 59, 59, 999)
  return aggregatePeriod(ctx, effectiveStoreId, startOfMonth, endOfMonth)
}

export async function getByUser(
  ctx: ShopflowContext,
  params: { userId: string },
  query: { startDate?: string; endDate?: string },
) {
  const { userId } = params
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, firstName: true, lastName: true },
  })
  if (!user) throw new NotFoundError('Usuario no encontrado')

  const where: Prisma.SaleWhereInput = { companyId: ctx.companyId, userId, status: 'COMPLETED' }
  const dateFilter = buildDateFilter(query.startDate, query.endDate)
  if (dateFilter) where.createdAt = dateFilter

  const agg = await prisma.sale.aggregate({ where, _count: true, _sum: { total: true } })
  const salesCount = agg._count
  const totalRevenue = Number(agg._sum.total ?? 0)
  const averageSale = salesCount > 0 ? totalRevenue / salesCount : 0
  const userName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email

  return { userId: user.id, userName, userEmail: user.email, salesCount, totalRevenue, averageSale }
}
