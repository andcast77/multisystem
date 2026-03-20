import { Prisma } from '../db/index.js'
import { TenantScopedRepository, type PaginatedResult } from '../common/database/index.js'

export type StoreInventoryRow = {
  id: string
  companyId: string
  storeId: string
  productId: string
  quantity: number
  minStock: number
  maxStock: number | null
  updatedAt: Date
}

export class StoreInventoryRepository extends TenantScopedRepository {

  async findByStoreAndProduct(storeId: string, productId: string): Promise<StoreInventoryRow | null> {
    return this.db.storeInventory.findFirst({
      where: { ...this.tenantWhere, storeId, productId },
    }) as Promise<StoreInventoryRow | null>
  }

  async findByStore(storeId: string): Promise<StoreInventoryRow[]> {
    return this.db.storeInventory.findMany({
      where: { ...this.tenantWhere, storeId },
    }) as Promise<StoreInventoryRow[]>
  }

  async findLowStock(storeId: string): Promise<StoreInventoryRow[]> {
    const rows = await this.db.$queryRaw<StoreInventoryRow[]>(
      Prisma.sql`SELECT * FROM store_inventory WHERE "companyId" = ${this.tenantId} AND "storeId" = ${storeId} AND quantity <= "minStock"`
    )
    return Array.isArray(rows) ? rows : []
  }

  async upsert(storeId: string, productId: string, data: { quantity?: number; minStock?: number; maxStock?: number | null }): Promise<StoreInventoryRow> {
    const existing = await this.db.storeInventory.findFirst({
      where: { ...this.tenantWhere, storeId, productId },
    })

    if (existing) {
      return this.db.storeInventory.update({
        where: { id: existing.id },
        data,
      }) as Promise<StoreInventoryRow>
    }

    return this.db.storeInventory.create({
      data: {
        companyId: this.tenantId,
        storeId,
        productId,
        quantity: data.quantity ?? 0,
        minStock: data.minStock ?? 0,
        maxStock: data.maxStock ?? null,
      },
    }) as Promise<StoreInventoryRow>
  }

  async adjustQuantity(storeId: string, productId: string, delta: number): Promise<StoreInventoryRow | null> {
    const existing = await this.db.storeInventory.findFirst({
      where: { ...this.tenantWhere, storeId, productId },
    })
    if (!existing) return null

    return this.db.storeInventory.update({
      where: { id: existing.id },
      data: { quantity: { increment: delta } },
    }) as Promise<StoreInventoryRow>
  }

  async decrementById(id: string, quantity: number): Promise<StoreInventoryRow> {
    return this.db.storeInventory.update({
      where: { id },
      data: { quantity: { decrement: quantity } },
    }) as Promise<StoreInventoryRow>
  }

  async incrementOrCreate(storeId: string, productId: string, quantity: number): Promise<StoreInventoryRow> {
    return this.db.storeInventory.upsert({
      where: { storeId_productId: { storeId, productId } },
      create: {
        companyId: this.tenantId,
        storeId,
        productId,
        quantity,
      },
      update: { quantity: { increment: quantity } },
    }) as Promise<StoreInventoryRow>
  }
}
