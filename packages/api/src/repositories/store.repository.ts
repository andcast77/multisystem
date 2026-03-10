import { TenantScopedRepository } from '../common/database/index.js'

export type StoreRow = {
  id: string
  companyId: string
  name: string
  code: string
  address: string | null
  phone: string | null
  email: string | null
  taxId: string | null
  active: boolean
  createdAt: Date
  updatedAt: Date
}

export type StoreCreateInput = {
  name: string
  code: string
  address?: string | null
  phone?: string | null
  email?: string | null
  taxId?: string | null
}

export class StoreRepository extends TenantScopedRepository {

  async findAll(opts?: { includeInactive?: boolean; userId?: string; fullAccess?: boolean }): Promise<StoreRow[]> {
    const activeFilter = opts?.includeInactive ? {} : { active: true }
    const userFilter = opts?.fullAccess ? {} : { userStores: { some: { userId: opts?.userId } } }

    return this.db.store.findMany({
      where: { ...this.tenantWhere, ...activeFilter, ...userFilter },
      orderBy: { name: 'asc' },
    }) as Promise<StoreRow[]>
  }

  async findById(id: string, opts?: { userId?: string; fullAccess?: boolean }): Promise<StoreRow | null> {
    const userFilter = opts?.fullAccess ? {} : { userStores: { some: { userId: opts?.userId } } }
    return this.db.store.findFirst({
      where: { ...this.tenantWhere, id, ...userFilter },
    }) as Promise<StoreRow | null>
  }

  async findByCode(code: string, opts?: { userId?: string; fullAccess?: boolean }): Promise<StoreRow | null> {
    const userFilter = opts?.fullAccess ? {} : { userStores: { some: { userId: opts?.userId } } }
    return this.db.store.findFirst({
      where: { ...this.tenantWhere, code, ...userFilter },
    }) as Promise<StoreRow | null>
  }

  async create(input: StoreCreateInput): Promise<StoreRow> {
    return this.db.store.create({
      data: { companyId: this.tenantId, ...input },
    }) as Promise<StoreRow>
  }

  async update(id: string, input: Partial<StoreCreateInput & { active: boolean }>): Promise<StoreRow | null> {
    const existing = await this.db.store.findFirst({
      where: { ...this.tenantWhere, id },
      select: { id: true },
    })
    if (!existing) return null
    return this.db.store.update({ where: { id }, data: input }) as Promise<StoreRow>
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.db.store.findFirst({
      where: { ...this.tenantWhere, id },
      select: { id: true },
    })
    if (!existing) return false
    await this.db.store.delete({ where: { id } })
    return true
  }
}
