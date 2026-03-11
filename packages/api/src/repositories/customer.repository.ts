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
    return this.db.customer.update({ where: { id }, data: input }) as Promise<CustomerRow>
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.db.customer.findFirst({
      where: { ...this.tenantWhere, id },
      select: { id: true },
    })
    if (!existing) return false
    await this.db.customer.delete({ where: { id } })
    return true
  }
}
