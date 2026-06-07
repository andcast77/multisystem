import { TenantScopedRepository } from '../common/database/index.js'

export type SupplierRow = {
  id: string
  companyId: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  taxId: string | null
  active: boolean
  createdAt: Date
  updatedAt: Date
}

export class SupplierRepository extends TenantScopedRepository {

  async findAll(): Promise<SupplierRow[]> {
    return this.db.supplier.findMany({
      where: this.tenantWhere,
      orderBy: { name: 'asc' },
    }) as Promise<SupplierRow[]>
  }

  async findById(id: string): Promise<SupplierRow | null> {
    return this.db.supplier.findFirst({
      where: { ...this.tenantWhere, id },
    }) as Promise<SupplierRow | null>
  }

  async create(input: Omit<SupplierRow, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>): Promise<SupplierRow> {
    return this.db.supplier.create({
      data: { companyId: this.tenantId, ...input },
    }) as Promise<SupplierRow>
  }

  async update(id: string, input: Partial<Omit<SupplierRow, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>>): Promise<SupplierRow | null> {
    const existing = await this.db.supplier.findFirst({
      where: { ...this.tenantWhere, id },
      select: { id: true },
    })
    if (!existing) return null
    const updated = await this.db.supplier.updateMany({
      where: { ...this.tenantWhere, id },
      data: input,
    })
    if (updated.count === 0) return null
    return this.db.supplier.findFirst({
      where: { ...this.tenantWhere, id },
    }) as Promise<SupplierRow | null>
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.db.supplier.findFirst({
      where: { ...this.tenantWhere, id },
      select: { id: true },
    })
    if (!existing) return false
    const deleted = await this.db.supplier.deleteMany({ where: { ...this.tenantWhere, id } })
    return deleted.count > 0
  }
}
