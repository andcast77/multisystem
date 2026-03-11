import { Prisma } from '../db/index.js'
import { TenantScopedRepository, toNumber, toNumberOrNull, type PaginatedResult } from '../common/database/index.js'

export type ProductRow = {
  id: string
  companyId: string
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

export type ProductSearchQuery = {
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

export type ProductCreateInput = {
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

export type ProductUpdateInput = Partial<ProductCreateInput>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(p: any): ProductRow {
  return {
    ...p,
    companyId: p.companyId,
    price: toNumber(p.price),
    cost: toNumberOrNull(p.cost),
  }
}

export class ProductRepository extends TenantScopedRepository {

  async findById(id: string): Promise<ProductRow | null> {
    const p = await this.db.product.findFirst({
      where: { ...this.tenantWhere, id },
    })
    return p ? mapRow(p) : null
  }

  async findBySku(sku: string): Promise<ProductRow | null> {
    const p = await this.db.product.findFirst({
      where: { ...this.activeTenantWhere, sku },
    })
    return p ? mapRow(p) : null
  }

  async findByBarcode(barcode: string): Promise<ProductRow | null> {
    const p = await this.db.product.findFirst({
      where: { ...this.activeTenantWhere, barcode },
    })
    return p ? mapRow(p) : null
  }

  async search(query: ProductSearchQuery): Promise<PaginatedResult<ProductRow>> {
    const { page, limit, skip } = this.parsePagination(query)
    const sortOrder = query.sortOrder === 'desc' ? 'desc' : 'asc'
    const validSortCols = ['name', 'price', 'stock', 'createdAt', 'updatedAt'] as const
    const orderByCol = validSortCols.includes(query.sortBy as typeof validSortCols[number])
      ? query.sortBy!
      : 'name'

    if (query.lowStock === 'true') {
      return this.searchLowStock(query, page, limit, skip, orderByCol, sortOrder)
    }

    const where = this.buildWhere(query)
    const [total, products] = await Promise.all([
      this.db.product.count({ where }),
      this.db.product.findMany({
        where,
        orderBy: { [orderByCol]: sortOrder },
        skip,
        take: limit,
      }),
    ])
    return this.paginatedResult(products.map(mapRow), total, page, limit)
  }

  async findLowStock(minStockThreshold?: number): Promise<ProductRow[]> {
    if (minStockThreshold != null && !isNaN(minStockThreshold)) {
      const rows = await this.db.$queryRaw<ProductRow[]>(
        Prisma.sql`SELECT id, "companyId", name, description, sku, barcode, price::float8, cost::float8, stock, "minStock", "maxStock", "categoryId", "supplierId", "storeId", active, "imageUrl", "createdAt", "updatedAt" FROM products WHERE "companyId" = ${this.tenantId} AND active = true AND stock <= ${minStockThreshold}`
      )
      return Array.isArray(rows) ? rows : []
    }
    const rows = await this.db.$queryRaw<ProductRow[]>(
      Prisma.sql`SELECT id, "companyId", name, description, sku, barcode, price::float8, cost::float8, stock, "minStock", "maxStock", "categoryId", "supplierId", "storeId", active, "imageUrl", "createdAt", "updatedAt" FROM products WHERE "companyId" = ${this.tenantId} AND active = true AND stock <= COALESCE("minStock", 0)`
    )
    return Array.isArray(rows) ? rows : []
  }

  async create(input: ProductCreateInput): Promise<ProductRow> {
    const p = await this.db.product.create({
      data: {
        companyId: this.tenantId,
        name: input.name,
        description: input.description ?? null,
        sku: input.sku ?? null,
        barcode: input.barcode ?? null,
        price: input.price,
        cost: input.cost ?? null,
        stock: input.stock ?? 0,
        minStock: input.minStock ?? null,
        maxStock: input.maxStock ?? null,
        categoryId: input.categoryId ?? null,
        supplierId: input.supplierId ?? null,
        storeId: input.storeId ?? null,
        active: input.active ?? true,
        imageUrl: input.imageUrl ?? null,
      },
    })
    return mapRow(p)
  }

  async update(id: string, input: ProductUpdateInput): Promise<ProductRow | null> {
    const existing = await this.db.product.findFirst({
      where: { ...this.tenantWhere, id },
      select: { id: true },
    })
    if (!existing) return null

    const data: Prisma.ProductUpdateInput = {}
    if (input.name !== undefined) data.name = input.name
    if (input.description !== undefined) data.description = input.description
    if (input.sku !== undefined) data.sku = input.sku
    if (input.barcode !== undefined) data.barcode = input.barcode
    if (input.price !== undefined) data.price = input.price
    if (input.cost !== undefined) data.cost = input.cost
    if (input.stock !== undefined) data.stock = input.stock
    if (input.minStock !== undefined) data.minStock = input.minStock
    if (input.maxStock !== undefined) data.maxStock = input.maxStock
    if (input.categoryId !== undefined) {
      data.category = input.categoryId ? { connect: { id: input.categoryId } } : { disconnect: true }
    }
    if (input.supplierId !== undefined) {
      data.supplier = input.supplierId ? { connect: { id: input.supplierId } } : { disconnect: true }
    }
    if (input.storeId !== undefined) data.storeId = input.storeId
    if (input.active !== undefined) data.active = input.active
    if (input.imageUrl !== undefined) data.imageUrl = input.imageUrl

    if (Object.keys(data).length === 0) return this.findById(id)

    const p = await this.db.product.update({ where: { id }, data })
    return mapRow(p)
  }

  async updateInventory(id: string, payload: { stock: number; minStock?: number }): Promise<ProductRow | null> {
    const existing = await this.db.product.findFirst({
      where: { ...this.tenantWhere, id },
      select: { id: true },
    })
    if (!existing) return null

    const data: Prisma.ProductUpdateInput = { stock: payload.stock }
    if (payload.minStock !== undefined) data.minStock = payload.minStock

    const p = await this.db.product.update({ where: { id }, data })
    return mapRow(p)
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.db.product.findFirst({
      where: { ...this.tenantWhere, id },
      select: { id: true },
    })
    if (!existing) return false
    await this.db.product.delete({ where: { id } })
    return true
  }

  private buildWhere(query: ProductSearchQuery): Prisma.ProductWhereInput {
    const where: Prisma.ProductWhereInput = { ...this.tenantWhere }
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

  private async searchLowStock(
    query: ProductSearchQuery,
    page: number,
    limit: number,
    skip: number,
    orderCol: string,
    sortOrder: string,
  ): Promise<PaginatedResult<ProductRow>> {
    const minStockThreshold = query.minPrice ? parseFloat(query.minPrice) : undefined
    const safeCol = ['name', 'price', 'stock', 'createdAt', 'updatedAt'].includes(orderCol) ? orderCol : 'name'
    const direction = sortOrder === 'desc' ? 'DESC' : 'ASC'

    const [totalResult, rows] = await Promise.all([
      minStockThreshold != null && !isNaN(minStockThreshold)
        ? this.db.$queryRaw<[{ count: bigint }]>(
            Prisma.sql`SELECT COUNT(*)::bigint as count FROM products WHERE "companyId" = ${this.tenantId} AND active = true AND stock <= ${minStockThreshold}`
          )
        : this.db.$queryRaw<[{ count: bigint }]>(
            Prisma.sql`SELECT COUNT(*)::bigint as count FROM products WHERE "companyId" = ${this.tenantId} AND active = true AND stock <= COALESCE("minStock", 0)`
          ),
      minStockThreshold != null && !isNaN(minStockThreshold)
        ? this.db.$queryRaw<ProductRow[]>(
            Prisma.sql`SELECT id, "companyId", name, description, sku, barcode, price::float8, cost::float8, stock, "minStock", "maxStock", "categoryId", "supplierId", "storeId", active, "imageUrl", "createdAt", "updatedAt" FROM products WHERE "companyId" = ${this.tenantId} AND active = true AND stock <= ${minStockThreshold} ORDER BY ${Prisma.raw(`"${safeCol}"`)} ${Prisma.raw(direction)} LIMIT ${limit} OFFSET ${skip}`
          )
        : this.db.$queryRaw<ProductRow[]>(
            Prisma.sql`SELECT id, "companyId", name, description, sku, barcode, price::float8, cost::float8, stock, "minStock", "maxStock", "categoryId", "supplierId", "storeId", active, "imageUrl", "createdAt", "updatedAt" FROM products WHERE "companyId" = ${this.tenantId} AND active = true AND stock <= COALESCE("minStock", 0) ORDER BY ${Prisma.raw(`"${safeCol}"`)} ${Prisma.raw(direction)} LIMIT ${limit} OFFSET ${skip}`
          ),
    ])
    const total = Number(totalResult[0]?.count ?? 0)
    return this.paginatedResult(Array.isArray(rows) ? rows : [], total, page, limit)
  }
}
