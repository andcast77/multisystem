import { TenantScopedRepository } from '../common/database/index.js'

export class PushSubscriptionRepository extends TenantScopedRepository {
  async listByUserId(userId: string) {
    return this.db.pushSubscription.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { endpoint: true, p256dh: true, auth: true },
    })
  }

  async findByEndpoint(endpoint: string) {
    return this.db.pushSubscription.findUnique({
      where: { endpoint },
    })
  }

  async upsertByEndpoint(input: { endpoint: string; userId: string; p256dh: string; auth: string }) {
    const existing = await this.findByEndpoint(input.endpoint)
    if (existing) {
      return this.db.pushSubscription.update({
        where: { endpoint: input.endpoint },
        data: {
          userId: input.userId,
          p256dh: input.p256dh,
          auth: input.auth,
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
    return this.db.pushSubscription.delete({
      where: { endpoint },
    })
  }
}
