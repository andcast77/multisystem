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
  categoryId: string | null
  supplierId: string | null
  unitId: string | null
  unit?: {
    id: string
    key: string
    name: string
    symbol: string | null
  } | null
  active: boolean
  imageUrl: string | null
  createdAt: Date
  updatedAt: Date
}

export type UnitRow = {
  id: string
  key: string
  name: string
  symbol: string | null
  isActive: boolean
}

export type ProductSearchQuery = {
  search?: string
  categoryId?: string
  unitId?: string
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
  categoryId?: string | null
  supplierId?: string | null
  unitId?: string | null
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
    unitId: p.unitId ?? null,
    unit: p.unit ? { id: p.unit.id, key: p.unit.key, name: p.unit.name, symbol: p.unit.symbol ?? null } : null,
  }
}

export class ProductRepository extends TenantScopedRepository {
  async listActiveUnits(): Promise<UnitRow[]> {
    return this.db.unit.findMany({
      where: { isActive: true },
      orderBy: [{ name: 'asc' }],
      select: { id: true, key: true, name: true, symbol: true, isActive: true },
    })
  }

  private async ensureValidUnit(unitId: string): Promise<void> {
    const unit = await this.db.unit.findFirst({
      where: { id: unitId, isActive: true },
      select: { id: true },
    })
    if (!unit) throw new Error('INVALID_UNIT')
  }

  async findById(id: string): Promise<ProductRow | null> {
    const p = await this.db.product.findFirst({
      where: { ...this.tenantWhere, id },
      include: { unit: { select: { id: true, key: true, name: true, symbol: true } } },
    })
    return p ? mapRow(p) : null
  }

  async findBySku(sku: string): Promise<ProductRow | null> {
    const p = await this.db.product.findFirst({
      where: { ...this.activeTenantWhere, sku },
      include: { unit: { select: { id: true, key: true, name: true, symbol: true } } },
    })
    return p ? mapRow(p) : null
  }

  async findByBarcode(barcode: string): Promise<ProductRow | null> {
    const p = await this.db.product.findFirst({
      where: { ...this.activeTenantWhere, barcode },
      include: { unit: { select: { id: true, key: true, name: true, symbol: true } } },
    })
    return p ? mapRow(p) : null
  }

  async search(query: ProductSearchQuery): Promise<PaginatedResult<ProductRow>> {
    const { page, limit, skip } = this.parsePagination(query)
    const sortOrder = query.sortOrder === 'desc' ? 'desc' : 'asc'
    const validSortCols = ['name', 'price', 'createdAt', 'updatedAt'] as const
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
        include: { unit: { select: { id: true, key: true, name: true, symbol: true } } },
      }),
    ])
    return this.paginatedResult(products.map(mapRow), total, page, limit)
  }

  async findLowStock(minStockThreshold?: number): Promise<(ProductRow & { totalStock: number })[]> {
    if (minStockThreshold != null && !isNaN(minStockThreshold)) {
      const rows = await this.db.$queryRaw<(ProductRow & { totalStock: number })[]>(
        Prisma.sql`
          SELECT p.id, p."companyId", p.name, p.description, p.sku, p.barcode,
            p.price::float8, p.cost::float8, p."categoryId", p."supplierId", p."unitId",
            p.active, p."imageUrl", p."createdAt", p."updatedAt",
            COALESCE(SUM(si.quantity), 0)::int as "totalStock"
          FROM products p
          LEFT JOIN store_inventory si ON si."productId" = p.id
          WHERE p."companyId" = ${this.tenantId} AND p.active = true
          GROUP BY p.id
          HAVING COALESCE(SUM(si.quantity), 0) <= ${minStockThreshold}
        `
      )
      return Array.isArray(rows) ? rows : []
    }
    const rows = await this.db.$queryRaw<(ProductRow & { totalStock: number })[]>(
      Prisma.sql`
        SELECT p.id, p."companyId", p.name, p.description, p.sku, p.barcode,
          p.price::float8, p.cost::float8, p."categoryId", p."supplierId", p."unitId",
          p.active, p."imageUrl", p."createdAt", p."updatedAt",
          COALESCE(SUM(si.quantity), 0)::int as "totalStock"
        FROM products p
        LEFT JOIN store_inventory si ON si."productId" = p.id
        WHERE p."companyId" = ${this.tenantId} AND p.active = true
        GROUP BY p.id
        HAVING COALESCE(SUM(si.quantity), 0) <= COALESCE(MIN(si."minStock"), 0)
      `
    )
    return Array.isArray(rows) ? rows : []
  }

  async create(input: ProductCreateInput): Promise<ProductRow> {
    if (input.unitId) await this.ensureValidUnit(input.unitId)
    const p = await this.db.product.create({
      data: {
        companyId: this.tenantId,
        name: input.name,
        description: input.description ?? null,
        sku: input.sku ?? null,
        barcode: input.barcode ?? null,
        price: input.price,
        cost: input.cost ?? null,
        categoryId: input.categoryId ?? null,
        supplierId: input.supplierId ?? null,
        unitId: input.unitId ?? null,
        active: input.active ?? true,
        imageUrl: input.imageUrl ?? null,
      },
      include: { unit: { select: { id: true, key: true, name: true, symbol: true } } },
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
    if (input.categoryId !== undefined) {
      data.category = input.categoryId ? { connect: { id: input.categoryId } } : { disconnect: true }
    }
    if (input.supplierId !== undefined) {
      data.supplier = input.supplierId ? { connect: { id: input.supplierId } } : { disconnect: true }
    }
    if (input.unitId !== undefined) {
      if (input.unitId) await this.ensureValidUnit(input.unitId)
      data.unit = input.unitId ? { connect: { id: input.unitId } } : { disconnect: true }
    }
    if (input.active !== undefined) data.active = input.active
    if (input.imageUrl !== undefined) data.imageUrl = input.imageUrl

    if (Object.keys(data).length === 0) return this.findById(id)

    const updated = await this.db.product.updateMany({
      where: { ...this.tenantWhere, id },
      data,
    })
    if (updated.count === 0) return null
    const p = await this.db.product.findFirst({
      where: { ...this.tenantWhere, id },
      include: { unit: { select: { id: true, key: true, name: true, symbol: true } } },
    })
    return p ? mapRow(p) : null
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.db.product.findFirst({
      where: { ...this.tenantWhere, id },
      select: { id: true },
    })
    if (!existing) return false
    const deleted = await this.db.product.deleteMany({ where: { ...this.tenantWhere, id } })
    return deleted.count > 0
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
    if (query.unitId) where.unitId = query.unitId
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
    const safeCol = ['name', 'price', 'createdAt', 'updatedAt'].includes(orderCol) ? orderCol : 'name'
    const direction = sortOrder === 'desc' ? 'DESC' : 'ASC'

    const havingClause = minStockThreshold != null && !isNaN(minStockThreshold)
      ? Prisma.sql`HAVING COALESCE(SUM(si.quantity), 0) <= ${minStockThreshold}`
      : Prisma.sql`HAVING COALESCE(SUM(si.quantity), 0) <= COALESCE(MIN(si."minStock"), 0)`

    const baseQuery = Prisma.sql`
      FROM products p
      LEFT JOIN store_inventory si ON si."productId" = p.id
      WHERE p."companyId" = ${this.tenantId} AND p.active = true
      GROUP BY p.id
      ${havingClause}
    `

    const [totalResult, rows] = await Promise.all([
      this.db.$queryRaw<[{ count: bigint }]>(
        Prisma.sql`SELECT COUNT(*)::bigint as count FROM (SELECT p.id ${baseQuery}) sub`
      ),
      this.db.$queryRaw<ProductRow[]>(
        Prisma.sql`
          SELECT p.id, p."companyId", p.name, p.description, p.sku, p.barcode,
            p.price::float8, p.cost::float8, p."categoryId", p."supplierId", p."unitId",
            p.active, p."imageUrl", p."createdAt", p."updatedAt"
          ${baseQuery}
          ORDER BY ${Prisma.raw(`p."${safeCol}"`)} ${Prisma.raw(direction)}
          LIMIT ${limit} OFFSET ${skip}
        `
      ),
    ])
    const total = Number(totalResult[0]?.count ?? 0)
    return this.paginatedResult(Array.isArray(rows) ? rows : [], total, page, limit)
  }
}
