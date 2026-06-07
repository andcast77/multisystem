import { TenantScopedRepository } from '../common/database/index.js'

export type CategoryRow = {
  id: string
  companyId: string
  name: string
  description: string | null
  parentId: string | null
  createdAt: Date
  updatedAt: Date
}

export class CategoryRepository extends TenantScopedRepository {

  async findAll(): Promise<CategoryRow[]> {
    return this.db.category.findMany({
      where: this.tenantWhere,
      orderBy: { name: 'asc' },
    }) as Promise<CategoryRow[]>
  }

  async findById(id: string): Promise<CategoryRow | null> {
    return this.db.category.findFirst({
      where: { ...this.tenantWhere, id },
    }) as Promise<CategoryRow | null>
  }

  async create(input: { name: string; description?: string | null; parentId?: string | null }): Promise<CategoryRow> {
    return this.db.category.create({
      data: { companyId: this.tenantId, ...input },
    }) as Promise<CategoryRow>
  }

  async update(id: string, input: Partial<{ name: string; description: string | null; parentId: string | null }>): Promise<CategoryRow | null> {
    const existing = await this.db.category.findFirst({
      where: { ...this.tenantWhere, id },
      select: { id: true },
    })
    if (!existing) return null
    const updated = await this.db.category.updateMany({
      where: { ...this.tenantWhere, id },
      data: input,
    })
    if (updated.count === 0) return null
    return this.db.category.findFirst({
      where: { ...this.tenantWhere, id },
    }) as Promise<CategoryRow | null>
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.db.category.findFirst({
      where: { ...this.tenantWhere, id },
      select: { id: true },
    })
    if (!existing) return false
    const deleted = await this.db.category.deleteMany({ where: { ...this.tenantWhere, id } })
    return deleted.count > 0
  }
}
