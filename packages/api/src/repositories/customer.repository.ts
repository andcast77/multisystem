import { TenantScopedRepository } from '../common/database/index.js'

export type CustomerRow = {
  id: string
  companyId: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  createdAt: Date
  updatedAt: Date
}

export class CustomerRepository extends TenantScopedRepository {

  async findAll(): Promise<CustomerRow[]> {
    return this.db.customer.findMany({
      where: this.tenantWhere,
      orderBy: { name: 'asc' },
    }) as Promise<CustomerRow[]>
  }

  async findById(id: string): Promise<CustomerRow | null> {
    return this.db.customer.findFirst({
      where: { ...this.tenantWhere, id },
    }) as Promise<CustomerRow | null>
  }

  async create(input: Omit<CustomerRow, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>): Promise<CustomerRow> {
    return this.db.customer.create({
      data: { companyId: this.tenantId, ...input },
    }) as Promise<CustomerRow>
  }

  async update(id: string, input: Partial<Omit<CustomerRow, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>>): Promise<CustomerRow | null> {
    const existing = await this.db.customer.findFirst({
      where: { ...this.tenantWhere, id },
      select: { id: true },
    })
    if (!existing) return null
    const updated = await this.db.customer.updateMany({
      where: { ...this.tenantWhere, id },
      data: input,
    })
    if (updated.count === 0) return null
    return this.db.customer.findFirst({
      where: { ...this.tenantWhere, id },
    }) as Promise<CustomerRow | null>
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.db.customer.findFirst({
      where: { ...this.tenantWhere, id },
      select: { id: true },
    })
    if (!existing) return false
    const deleted = await this.db.customer.deleteMany({ where: { ...this.tenantWhere, id } })
    return deleted.count > 0
  }
}
