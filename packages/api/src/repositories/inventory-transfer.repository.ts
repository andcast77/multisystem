import { Prisma } from '../db/index.js'
import { TenantScopedRepository } from '../common/database/index.js'

const TRANSFER_STATUSES = ['PENDING', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED'] as const

type TransferQuery = { fromStoreId?: string; toStoreId?: string; productId?: string; status?: string; page?: string; limit?: string }

export class InventoryTransferRepository extends TenantScopedRepository {
  async list(query: TransferQuery) {
    const { page, limit, skip } = this.parsePagination(query)
    const where: Prisma.InventoryTransferWhereInput = { ...this.tenantWhere }
    if (query.fromStoreId) where.fromStoreId = query.fromStoreId
    if (query.toStoreId) where.toStoreId = query.toStoreId
    if (query.productId) where.productId = query.productId
    if (query.status && TRANSFER_STATUSES.includes(query.status as (typeof TRANSFER_STATUSES)[number])) {
      where.status = query.status as (typeof TRANSFER_STATUSES)[number]
    }

    const [total, transfers] = await Promise.all([
      this.db.inventoryTransfer.count({ where }),
      this.db.inventoryTransfer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ])
    return this.paginatedResult(transfers, total, page, limit)
  }

  async createPending(input: {
    fromStoreId: string
    toStoreId: string
    productId: string
    quantity: number
    notes?: string | null
    createdById: string
  }) {
    return this.db.inventoryTransfer.create({
      data: {
        companyId: this.tenantId,
        fromStoreId: input.fromStoreId,
        toStoreId: input.toStoreId,
        productId: input.productId,
        quantity: input.quantity,
        notes: input.notes ?? null,
        status: 'PENDING',
        createdById: input.createdById,
      },
    })
  }

  async findById(id: string) {
    return this.db.inventoryTransfer.findFirst({
      where: { ...this.tenantWhere, id },
    })
  }

  async findByIdForCompletion(id: string) {
    return this.db.inventoryTransfer.findFirst({
      where: { ...this.tenantWhere, id },
      select: {
        id: true,
        status: true,
        productId: true,
        quantity: true,
        fromStoreId: true,
        toStoreId: true,
      },
    })
  }

  async updateStatus(id: string, status: 'COMPLETED' | 'CANCELLED', completedAt?: Date) {
    return this.db.inventoryTransfer.update({
      where: { id },
      data: {
        status,
        ...(completedAt ? { completedAt } : {}),
      },
    })
  }
}
