import { TenantScopedRepository } from '../common/database/index.js'

export class SalesRepository extends TenantScopedRepository {
  async countByUserId(userId: string): Promise<number> {
    return this.db.sale.count({
      where: { ...this.tenantWhere, userId },
    })
  }
}
