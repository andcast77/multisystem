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
    return this.db.category.update({ where: { id }, data: input }) as Promise<CategoryRow>
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.db.category.findFirst({
      where: { ...this.tenantWhere, id },
      select: { id: true },
    })
    if (!existing) return false
    await this.db.category.delete({ where: { id } })
    return true
  }
}
