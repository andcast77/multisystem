import { TenantScopedRepository } from '../common/database/index.js'

export class PushSubscriptionRepository extends TenantScopedRepository {
  async listByUserId(userId: string) {
    return this.db.pushSubscription.findMany({
      where: { userId, user: { companyMemberships: { some: { companyId: this.tenantId } } } },
      orderBy: { createdAt: 'desc' },
      select: { endpoint: true, p256dh: true, auth: true },
    })
  }

  async findByEndpoint(endpoint: string) {
    return this.db.pushSubscription.findFirst({
      where: {
        endpoint,
        user: { companyMemberships: { some: { companyId: this.tenantId } } },
      },
    })
  }

  async upsertByEndpoint(input: { endpoint: string; userId: string; p256dh: string; auth: string }) {
    const existing = await this.findByEndpoint(input.endpoint)
    if (existing) {
      const updated = await this.db.pushSubscription.updateMany({
        where: {
          endpoint: input.endpoint,
          user: { companyMemberships: { some: { companyId: this.tenantId } } },
        },
        data: {
          userId: input.userId,
          p256dh: input.p256dh,
          auth: input.auth,
        },
      })
      if (updated.count === 0) return existing
      return this.db.pushSubscription.findFirst({
        where: {
          endpoint: input.endpoint,
          user: { companyMemberships: { some: { companyId: this.tenantId } } },
        },
      })
    }
    return this.db.pushSubscription.create({
      data: {
        userId: input.userId,
        endpoint: input.endpoint,
        p256dh: input.p256dh,
        auth: input.auth,
      },
    })
  }

  async deleteByEndpoint(endpoint: string) {
    return this.db.pushSubscription.deleteMany({
      where: {
        endpoint,
        user: { companyMemberships: { some: { companyId: this.tenantId } } },
      },
    })
  }
}
