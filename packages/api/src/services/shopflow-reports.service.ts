import type { FastifyReply } from 'fastify'
import { Prisma, prisma } from '../db/index.js'
import type { ShopflowContext } from '../core/auth-context.js'

/** Resolve effective storeId for reports: USER = from context/fallback store, OWNER/ADMIN = from query or all. Returns null if USER without any store (caller should 403). */
export async function resolveEffectiveStoreIdForReport(
  ctx: ShopflowContext,
  queryStoreId?: string
): Promise<string | null | undefined> {
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
  return store?.id ?? null
}

export async function getStats(
  ctx: ShopflowContext,
  query: { storeId?: string; startDate?: string; endDate?: string },
  reply: FastifyReply
): Promise<{ success: boolean; data?: unknown; error?: string; message?: string }> {
  const effectiveStoreId = await resolveEffectiveStoreIdForReport(ctx, query.storeId)
  if (effectiveStoreId === null) {
    reply.code(403).send({
      success: false,
      error:
        'Envía el parámetro storeId (query) o el header X-Store-Id con el id del local de venta para ver reportes (usuario no administrador)',
    })
    return { success: false, error: 'Forbidden' }
  }
  const { startDate, endDate } = query

  const where: Prisma.SaleWhereInput = {
    companyId: ctx.companyId,
    status: 'COMPLETED',
  }
  if (effectiveStoreId !== undefined) where.storeId = effectiveStoreId
  if (startDate && endDate) where.createdAt = { gte: new Date(startDate), lte: new Date(endDate) }
  else if (startDate) where.createdAt = { gte: new Date(startDate) }
  else if (endDate) where.createdAt = { lte: new Date(endDate) }

  const agg = await prisma.sale.aggregate({
    where,
    _count: true,
    _sum: { total: true, tax: true, discount: true },
  })
  const salesCount = agg._count
  const totalRevenue = Number(agg._sum.total ?? 0)
  const totalTax = Number(agg._sum.tax ?? 0)
  const totalDiscount = Number(agg._sum.discount ?? 0)
  const averageSale = salesCount > 0 ? totalRevenue / salesCount : 0

  return {
    success: true,
    data: {
      totalSales: salesCount,
      totalRevenue,
      totalTax,
      totalDiscount,
      averageSale,
      salesCount,
    },
  }
}

export async function getDaily(
  ctx: ShopflowContext,
  query: { storeId?: string; days?: string },
  reply: FastifyReply
): Promise<{ success: boolean; data?: unknown; error?: string; message?: string }> {
  const effectiveStoreId = await resolveEffectiveStoreIdForReport(ctx, query.storeId)
  if (effectiveStoreId === null) {
    reply.code(403).send({
      success: false,
      error:
        'Envía el parámetro storeId (query) o el header X-Store-Id con el id del local de venta para ver reportes (usuario no administrador)',
    })
    return { success: false, error: 'Forbidden' }
  }
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
    salesMap.set(dateStr, {
      sales: Number(s.sales),
      revenue: Number(s.revenue),
    })
  })
  const result: { date: string; sales: number; revenue: number }[] = []
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)
    const dateStr = date.toISOString().split('T')[0]
    const data = salesMap.get(dateStr) || { sales: 0, revenue: 0 }
    result.push({
      date: dateStr,
      sales: data.sales,
      revenue: data.revenue,
    })
  }
  return { success: true, data: result }
}

export async function getTopProducts(
  ctx: ShopflowContext,
  query: { storeId?: string; limit?: string; startDate?: string; endDate?: string; categoryId?: string },
  reply: FastifyReply
): Promise<{ success: boolean; data?: unknown; error?: string; message?: string }> {
  const effectiveStoreId = await resolveEffectiveStoreIdForReport(ctx, query.storeId)
  if (effectiveStoreId === null) {
    reply.code(403).send({
      success: false,
      error:
        'Envía el parámetro storeId (query) o el header X-Store-Id con el id del local de venta para ver reportes (usuario no administrador)',
    })
    return { success: false, error: 'Forbidden' }
  }
  const limit = parseInt(query.limit || '10')
  const { startDate, endDate, categoryId } = query

  const whereSale: Prisma.SaleWhereInput = {
    companyId: ctx.companyId,
    status: 'COMPLETED',
  }
  if (effectiveStoreId !== undefined) whereSale.storeId = effectiveStoreId
  if (startDate && endDate) whereSale.createdAt = { gte: new Date(startDate), lte: new Date(endDate) }
  else if (startDate) whereSale.createdAt = { gte: new Date(startDate) }
  else if (endDate) whereSale.createdAt = { lte: new Date(endDate) }

  const saleIds = (await prisma.sale.findMany({ where: whereSale, select: { id: true } })).map((s) => s.id)
  if (saleIds.length === 0) return { success: true, data: [] }

  const items = await prisma.saleItem.findMany({
    where: {
      saleId: { in: saleIds },
      ...(categoryId ? { product: { categoryId } } : {}),
    },
    include: { product: { select: { id: true, name: true } } },
  })
  const byProduct = new Map<string, { productName: string; quantity: number; revenue: number; salesCount: Set<string> }>()
  for (const item of items) {
    const id = item.productId
    const cur = byProduct.get(id)
    const rev = Number(item.subtotal)
    if (!cur) {
      byProduct.set(id, {
        productName: item.product.name,
        quantity: item.quantity,
        revenue: rev,
        salesCount: new Set([item.saleId]),
      })
    } else {
      cur.quantity += item.quantity
      cur.revenue += rev
      cur.salesCount.add(item.saleId)
    }
  }
  const data = Array.from(byProduct.entries())
    .map(([productId, v]) => ({
      productId,
      productName: v.productName,
      quantity: v.quantity,
      revenue: v.revenue,
      salesCount: v.salesCount.size,
    }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, limit)
  return { success: true, data }
}

export async function getPaymentMethods(
  ctx: ShopflowContext,
  query: { storeId?: string; startDate?: string; endDate?: string },
  reply: FastifyReply
): Promise<{ success: boolean; data?: unknown; error?: string; message?: string }> {
  const effectiveStoreId = await resolveEffectiveStoreIdForReport(ctx, query.storeId)
  if (effectiveStoreId === null) {
    reply.code(403).send({
      success: false,
      error:
        'Envía el parámetro storeId (query) o el header X-Store-Id con el id del local de venta para ver reportes (usuario no administrador)',
    })
    return { success: false, error: 'Forbidden' }
  }
  const { startDate, endDate } = query

  const where: Prisma.SaleWhereInput = {
    companyId: ctx.companyId,
    status: 'COMPLETED',
  }
  if (effectiveStoreId !== undefined) where.storeId = effectiveStoreId
  if (startDate && endDate) where.createdAt = { gte: new Date(startDate), lte: new Date(endDate) }
  else if (startDate) where.createdAt = { gte: new Date(startDate) }
  else if (endDate) where.createdAt = { lte: new Date(endDate) }

  const results = await prisma.sale.groupBy({
    by: ['paymentMethod'],
    where,
    _count: true,
    _sum: { total: true },
  })
  const data = results
    .filter((r) => r.paymentMethod != null)
    .map((r) => ({
      paymentMethod: r.paymentMethod!,
      count: r._count,
      total: Number(r._sum.total ?? 0),
    }))
  return { success: true, data }
}

export async function getInventory(
  ctx: ShopflowContext,
  query: { storeId?: string },
  reply: FastifyReply
): Promise<{ success: boolean; data?: unknown; error?: string; message?: string }> {
  const effectiveStoreId = await resolveEffectiveStoreIdForReport(ctx, query.storeId)
  if (effectiveStoreId === null) {
    reply.code(403).send({
      success: false,
      error:
        'Envía el parámetro storeId (query) o el header X-Store-Id con el id del local de venta para ver reportes (usuario no administrador)',
    })
    return { success: false, error: 'Forbidden' }
  }

  const productWhere: Prisma.ProductWhereInput = {
    companyId: ctx.companyId,
    active: true,
  }
  if (effectiveStoreId !== undefined) productWhere.storeId = effectiveStoreId

  const storeCond = effectiveStoreId !== undefined ? Prisma.sql`AND "storeId" IS NOT DISTINCT FROM ${effectiveStoreId}` : Prisma.sql``
  const [products, totalProducts, statsRaw, outOfStock] = await Promise.all([
    prisma.product.findMany({
      where: productWhere,
      orderBy: { stock: 'asc' },
      take: 10,
      select: { id: true, name: true, stock: true, price: true, cost: true, minStock: true },
    }),
    prisma.product.count({ where: productWhere }),
    prisma.$queryRaw<[{ total: bigint; lowStock: bigint; totalValue: unknown; totalRetailValue: unknown }]>(
      Prisma.sql`
        SELECT
          COUNT(*)::bigint as total,
          COUNT(CASE WHEN stock <= COALESCE("minStock", 0) THEN 1 END)::bigint as "lowStock",
          COALESCE(SUM(stock * COALESCE(cost, 0)), 0) as "totalValue",
          COALESCE(SUM(stock * price), 0) as "totalRetailValue"
        FROM products
        WHERE "companyId" = ${ctx.companyId} AND active = true ${storeCond}
      `
    ),
    prisma.product.count({ where: { ...productWhere, stock: 0 } }),
  ])
  const stats = statsRaw[0]
  const lowStock = Number(stats?.lowStock ?? 0)
  const totalValue = Number(stats?.totalValue ?? 0)
  const totalRetailValue = Number(stats?.totalRetailValue ?? 0)

  const num = (v: unknown) => (v == null ? 0 : typeof v === 'object' && 'toNumber' in (v as object) ? (v as { toNumber: () => number }).toNumber() : Number(v))

  return {
    success: true,
    data: {
      totalProducts,
      lowStockProducts: lowStock,
      outOfStockProducts: outOfStock,
      totalValue,
      totalRetailValue,
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        stock: p.stock,
        minStock: p.minStock,
        price: num(p.price),
        value: p.stock * num(p.cost),
      })),
    },
  }
}

export async function getToday(
  ctx: ShopflowContext,
  query: { storeId?: string },
  reply: FastifyReply
): Promise<{ success: boolean; data?: unknown; error?: string; message?: string }> {
  const effectiveStoreId = await resolveEffectiveStoreIdForReport(ctx, query.storeId)
  if (effectiveStoreId === null) {
    reply.code(403).send({
      success: false,
      error:
        'Envía el parámetro storeId (query) o el header X-Store-Id con el id del local de venta para ver reportes (usuario no administrador)',
    })
    return { success: false, error: 'Forbidden' }
  }
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const endOfDay = new Date(today)
  endOfDay.setHours(23, 59, 59, 999)

  const where: Prisma.SaleWhereInput = {
    companyId: ctx.companyId,
    status: 'COMPLETED',
    createdAt: { gte: today, lte: endOfDay },
  }
  if (effectiveStoreId !== undefined) where.storeId = effectiveStoreId

  const agg = await prisma.sale.aggregate({
    where,
    _count: true,
    _sum: { total: true, tax: true, discount: true },
  })
  const salesCount = agg._count
  const totalRevenue = Number(agg._sum.total ?? 0)
  const totalTax = Number(agg._sum.tax ?? 0)
  const totalDiscount = Number(agg._sum.discount ?? 0)
  const averageSale = salesCount > 0 ? totalRevenue / salesCount : 0

  return {
    success: true,
    data: {
      totalSales: salesCount,
      totalRevenue,
      totalTax,
      totalDiscount,
      averageSale,
      salesCount,
    },
  }
}

export async function getWeek(
  ctx: ShopflowContext,
  query: { storeId?: string },
  reply: FastifyReply
): Promise<{ success: boolean; data?: unknown; error?: string; message?: string }> {
  const effectiveStoreId = await resolveEffectiveStoreIdForReport(ctx, query.storeId)
  if (effectiveStoreId === null) {
    reply.code(403).send({
      success: false,
      error:
        'Envía el parámetro storeId (query) o el header X-Store-Id con el id del local de venta para ver reportes (usuario no administrador)',
    })
    return { success: false, error: 'Forbidden' }
  }
  const today = new Date()
  const dayOfWeek = today.getDay()
  const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
  const startOfWeek = new Date(today.setDate(diff))
  startOfWeek.setHours(0, 0, 0, 0)
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(endOfWeek.getDate() + 6)
  endOfWeek.setHours(23, 59, 59, 999)

  const where: Prisma.SaleWhereInput = {
    companyId: ctx.companyId,
    status: 'COMPLETED',
    createdAt: { gte: startOfWeek, lte: endOfWeek },
  }
  if (effectiveStoreId !== undefined) where.storeId = effectiveStoreId
  const agg = await prisma.sale.aggregate({ where, _count: true, _sum: { total: true, tax: true, discount: true } })
  const salesCount = agg._count
  const totalRevenue = Number(agg._sum.total ?? 0)
  const totalTax = Number(agg._sum.tax ?? 0)
  const totalDiscount = Number(agg._sum.discount ?? 0)
  const averageSale = salesCount > 0 ? totalRevenue / salesCount : 0
  return {
    success: true,
    data: { totalSales: salesCount, totalRevenue, totalTax, totalDiscount, averageSale, salesCount },
  }
}

export async function getMonth(
  ctx: ShopflowContext,
  query: { storeId?: string },
  reply: FastifyReply
): Promise<{ success: boolean; data?: unknown; error?: string; message?: string }> {
  const effectiveStoreId = await resolveEffectiveStoreIdForReport(ctx, query.storeId)
  if (effectiveStoreId === null) {
    reply.code(403).send({
      success: false,
      error:
        'Envía el parámetro storeId (query) o el header X-Store-Id con el id del local de venta para ver reportes (usuario no administrador)',
    })
    return { success: false, error: 'Forbidden' }
  }
  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  startOfMonth.setHours(0, 0, 0, 0)
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
  endOfMonth.setHours(23, 59, 59, 999)

  const where: Prisma.SaleWhereInput = {
    companyId: ctx.companyId,
    status: 'COMPLETED',
    createdAt: { gte: startOfMonth, lte: endOfMonth },
  }
  if (effectiveStoreId !== undefined) where.storeId = effectiveStoreId
  const agg = await prisma.sale.aggregate({ where, _count: true, _sum: { total: true, tax: true, discount: true } })
  const salesCount = agg._count
  const totalRevenue = Number(agg._sum.total ?? 0)
  const totalTax = Number(agg._sum.tax ?? 0)
  const totalDiscount = Number(agg._sum.discount ?? 0)
  const averageSale = salesCount > 0 ? totalRevenue / salesCount : 0
  return {
    success: true,
    data: { totalSales: salesCount, totalRevenue, totalTax, totalDiscount, averageSale, salesCount },
  }
}

export async function getByUser(
  ctx: ShopflowContext,
  params: { userId: string },
  query: { startDate?: string; endDate?: string },
  reply: FastifyReply
): Promise<{ success: boolean; data?: unknown; error?: string; message?: string }> {
  const { userId } = params
  const { startDate, endDate } = query

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, firstName: true, lastName: true },
  })
  if (!user) {
    reply.code(404)
    return { success: false, error: 'Usuario no encontrado' }
  }

  const where: Prisma.SaleWhereInput = {
    companyId: ctx.companyId,
    userId,
    status: 'COMPLETED',
  }
  if (startDate && endDate) where.createdAt = { gte: new Date(startDate), lte: new Date(endDate) }
  else if (startDate) where.createdAt = { gte: new Date(startDate) }
  else if (endDate) where.createdAt = { lte: new Date(endDate) }

  const agg = await prisma.sale.aggregate({ where, _count: true, _sum: { total: true } })
  const salesCount = agg._count
  const totalRevenue = Number(agg._sum.total ?? 0)
  const averageSale = salesCount > 0 ? totalRevenue / salesCount : 0
  const userName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email

  return {
    success: true,
    data: {
      userId: user.id,
      userName,
      userEmail: user.email,
      salesCount,
      totalRevenue,
      averageSale,
    },
  }
}
