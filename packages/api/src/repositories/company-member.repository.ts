import { TenantScopedRepository } from '../common/database/index.js'

export class CompanyMemberRepository extends TenantScopedRepository {
  async existsUserMembership(userId: string): Promise<boolean> {
    const membership = await this.db.companyMember.findUnique({
      where: { userId_companyId: { userId, companyId: this.tenantId } },
      select: { userId: true },
    })
    return membership != null
  }
}
