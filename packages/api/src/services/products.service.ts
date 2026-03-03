import { Prisma, prisma } from '../db/index.js'
import type { CompanyContext } from '../core/auth-context.js'

type ProductRow = {
  id: string
  companyId: string | null
  name: string
  description: string | null
  sku: string | null
  barcode: string | null
  price: number
  cost: number | null
  stock: number
  minStock: number | null
  maxStock: number | null
  categoryId: string | null
  supplierId: string | null
  storeId: string | null
  active: boolean
  imageUrl: string | null
  createdAt: Date
  updatedAt: Date
}

function toProductRow(p: {
  id: string
  companyId: string | null
  name: string
  description: string | null
  sku: string | null
  barcode: string | null
  price: unknown
  cost: unknown
  stock: number
  minStock: number | null
  maxStock: number | null
  categoryId: string | null
  supplierId: string | null
  storeId: string | null
  active: boolean
  imageUrl: string | null
  createdAt: Date
  updatedAt: Date
}): ProductRow {
  const num = (v: unknown) => (v == null ? null : typeof v === 'object' && v !== null && 'toNumber' in v ? (v as { toNumber: () => number }).toNumber() : Number(v))
  return {
    ...p,
    price: num(p.price) ?? 0,
    cost: p.cost == null ? null : num(p.cost),
  } as ProductRow
}

export async function getProductBySku(
  ctx: CompanyContext,
  sku: string
): Promise<ProductRow | null> {
  const p = await prisma.product.findFirst({
    where: { companyId: ctx.companyId, sku, active: true },
  })
  return p ? toProductRow(p) : null
}

export async function getProductByBarcode(
  ctx: CompanyContext,
  barcode: string
): Promise<ProductRow | null> {
  const p = await prisma.product.findFirst({
    where: { companyId: ctx.companyId, barcode, active: true },
  })
  return p ? toProductRow(p) : null
}

export async function getProductById(
  ctx: CompanyContext,
  id: string
): Promise<ProductRow | null> {
  const p = await prisma.product.findFirst({
    where: { id, companyId: ctx.companyId },
  })
  return p ? toProductRow(p) : null
}

type ListQuery = {
  search?: string
  categoryId?: string
  active?: string
  minPrice?: string
  maxPrice?: string
  lowStock?: string
  page?: string
  limit?: string
  sortBy?: string
  sortOrder?: string
}

function buildWhere(ctx: CompanyContext, query: ListQuery): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = { companyId: ctx.companyId }
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { description: { contains: query.search, mode: 'insensitive' } },
      { sku: { contains: query.search, mode: 'insensitive' } },
      { barcode: { contains: query.search, mode: 'insensitive' } },
    ]
  }
  if (query.categoryId) where.categoryId = query.categoryId
  if (query.active === 'true') where.active = true
  else if (query.active === 'false') where.active = false
  const minP = query.minPrice ? parseFloat(query.minPrice) : NaN
  const maxP = query.maxPrice ? parseFloat(query.maxPrice) : NaN
  if (!isNaN(minP) && !isNaN(maxP)) where.price = { gte: minP, lte: maxP }
  else if (!isNaN(minP)) where.price = { gte: minP }
  else if (!isNaN(maxP)) where.price = { lte: maxP }
  return where
}

export async function listProducts(
  ctx: CompanyContext,
  query: ListQuery
): Promise<{
  products: ProductRow[]
  page: number
  limit: number
  total: number
  totalPages: number
}> {
  const page = Math.max(1, parseInt(query.page ?? '1', 10) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? '20', 10) || 20))
  const skip = (page - 1) * limit
  const sortOrder = query.sortOrder === 'desc' ? 'desc' : 'asc'
  const validSortCols: (keyof Prisma.ProductOrderByWithRelationInput)[] = ['name', 'price', 'stock', 'createdAt', 'updatedAt']
  const orderByCol = (validSortCols.includes((query.sortBy as keyof Prisma.ProductOrderByWithRelationInput) ?? 'name') ? query.sortBy : 'name') as keyof Prisma.ProductOrderByWithRelationInput

  if (query.lowStock === 'true') {
    const minStockThreshold = query.minPrice ? parseFloat(query.minPrice) : undefined
    const orderCol = ['name', 'price', 'stock', 'createdAt', 'updatedAt'].includes(orderByCol as string) ? orderByCol : 'name'
    const [totalResult, rows] = await Promise.all([
      minStockThreshold != null && !isNaN(minStockThreshold)
        ? prisma.$queryRaw<[{ count: bigint }]>(
            Prisma.sql`SELECT COUNT(*)::bigint as count FROM products WHERE "companyId" = ${ctx.companyId} AND active = true AND stock <= ${minStockThreshold}`
          )
        : prisma.$queryRaw<[{ count: bigint }]>(
            Prisma.sql`SELECT COUNT(*)::bigint as count FROM products WHERE "companyId" = ${ctx.companyId} AND active = true AND stock <= COALESCE("minStock", 0)`
          ),
      minStockThreshold != null && !isNaN(minStockThreshold)
        ? prisma.$queryRaw<ProductRow[]>(
            Prisma.sql`SELECT id, "companyId", name, description, sku, barcode, price::float8, cost::float8, stock, "minStock", "maxStock", "categoryId", "supplierId", "storeId", active, "imageUrl", "createdAt", "updatedAt" FROM products WHERE "companyId" = ${ctx.companyId} AND active = true AND stock <= ${minStockThreshold} ORDER BY ${Prisma.raw(`"${orderCol}"`)} ${Prisma.raw(String(sortOrder === 'desc' ? 'DESC' : 'ASC'))} LIMIT ${limit} OFFSET ${skip}`
          )
        : prisma.$queryRaw<ProductRow[]>(
            Prisma.sql`SELECT id, "companyId", name, description, sku, barcode, price::float8, cost::float8, stock, "minStock", "maxStock", "categoryId", "supplierId", "storeId", active, "imageUrl", "createdAt", "updatedAt" FROM products WHERE "companyId" = ${ctx.companyId} AND active = true AND stock <= COALESCE("minStock", 0) ORDER BY ${Prisma.raw(`"${orderCol}"`)} ${Prisma.raw(String(sortOrder === 'desc' ? 'DESC' : 'ASC'))} LIMIT ${limit} OFFSET ${skip}`
          ),
    ])
    const total = Number(totalResult[0]?.count ?? 0)
    return {
      products: Array.isArray(rows) ? rows : [],
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    }
  }

  const where = buildWhere(ctx, query)
  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: { [orderByCol]: sortOrder },
      skip,
      take: limit,
    }),
  ])
  return {
    products: products.map(toProductRow),
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  }
}

type CreateBody = {
  name: string
  description?: string | null
  sku?: string | null
  barcode?: string | null
  price: number
  cost?: number | null
  stock?: number
  minStock?: number | null
  maxStock?: number | null
  categoryId?: string | null
  supplierId?: string | null
  storeId?: string | null
  active?: boolean
  imageUrl?: string | null
}

export async function createProduct(
  ctx: CompanyContext,
  body: CreateBody
): Promise<ProductRow> {
  const p = await prisma.product.create({
    data: {
      companyId: ctx.companyId,
      name: body.name,
      description: body.description ?? null,
      sku: body.sku ?? null,
      barcode: body.barcode ?? null,
      price: body.price,
      cost: body.cost ?? null,
      stock: body.stock ?? 0,
      minStock: body.minStock ?? null,
      maxStock: body.maxStock ?? null,
      categoryId: body.categoryId ?? null,
      supplierId: body.supplierId ?? null,
      storeId: body.storeId ?? null,
      active: body.active ?? true,
      imageUrl: body.imageUrl ?? null,
    },
  })
  return toProductRow(p)
}

export async function getLowStock(
  ctx: CompanyContext,
  minStockThreshold?: number
): Promise<ProductRow[]> {
  if (minStockThreshold != null && !isNaN(minStockThreshold)) {
    const rows = await prisma.$queryRaw<ProductRow[]>(
      Prisma.sql`SELECT id, "companyId", name, description, sku, barcode, price::float8, cost::float8, stock, "minStock", "maxStock", "categoryId", "supplierId", "storeId", active, "imageUrl", "createdAt", "updatedAt" FROM products WHERE "companyId" = ${ctx.companyId} AND active = true AND stock <= ${minStockThreshold}`
    )
    return Array.isArray(rows) ? rows : []
  }
  const rows = await prisma.$queryRaw<ProductRow[]>(
    Prisma.sql`SELECT id, "companyId", name, description, sku, barcode, price::float8, cost::float8, stock, "minStock", "maxStock", "categoryId", "supplierId", "storeId", active, "imageUrl", "createdAt", "updatedAt" FROM products WHERE "companyId" = ${ctx.companyId} AND active = true AND stock <= COALESCE("minStock", 0)`
  )
  return Array.isArray(rows) ? rows : []
}

type UpdateBody = Partial<{
  name: string
  description: string | null
  sku: string | null
  barcode: string | null
  price: number
  cost: number | null
  stock: number
  minStock: number | null
  maxStock: number | null
  categoryId: string | null
  supplierId: string | null
  storeId: string | null
  active: boolean
  imageUrl: string | null
}>

export async function updateProduct(
  ctx: CompanyContext,
  id: string,
  body: UpdateBody
): Promise<ProductRow | null> {
  const existing = await prisma.product.findFirst({
    where: { id, companyId: ctx.companyId },
    select: { id: true },
  })
  if (!existing) return null
  const data: Prisma.ProductUpdateInput = {}
  if (body.name !== undefined) data.name = body.name
  if (body.description !== undefined) data.description = body.description
  if (body.sku !== undefined) data.sku = body.sku
  if (body.barcode !== undefined) data.barcode = body.barcode
  if (body.price !== undefined) data.price = body.price
  if (body.cost !== undefined) data.cost = body.cost
  if (body.stock !== undefined) data.stock = body.stock
  if (body.minStock !== undefined) data.minStock = body.minStock
  if (body.maxStock !== undefined) data.maxStock = body.maxStock
  if (body.categoryId !== undefined) {
    data.category = body.categoryId ? { connect: { id: body.categoryId } } : { disconnect: true }
  }
  if (body.supplierId !== undefined) {
    data.supplier = body.supplierId ? { connect: { id: body.supplierId } } : { disconnect: true }
  }
  if (body.storeId !== undefined) data.storeId = body.storeId
  if (body.active !== undefined) data.active = body.active
  if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl
  if (Object.keys(data).length === 0) return getProductById(ctx, id)
  const p = await prisma.product.update({
    where: { id },
    data,
  })
  return toProductRow(p)
}

export async function updateProductInventory(
  ctx: CompanyContext,
  id: string,
  payload: { stock: number; minStock?: number }
): Promise<ProductRow | null> {
  const existing = await prisma.product.findFirst({
    where: { id, companyId: ctx.companyId },
    select: { id: true },
  })
  if (!existing) return null
  const data: Prisma.ProductUpdateInput = { stock: payload.stock }
  if (payload.minStock !== undefined) data.minStock = payload.minStock
  const p = await prisma.product.update({
    where: { id },
    data,
  })
  return toProductRow(p)
}

export async function deleteProduct(ctx: CompanyContext, id: string): Promise<boolean> {
  const existing = await prisma.product.findFirst({
    where: { id, companyId: ctx.companyId },
    select: { id: true },
  })
  if (!existing) return false
  await prisma.product.delete({ where: { id } })
  return true
}
