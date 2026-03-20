import { TenantScopedRepository } from '../common/database/index.js'

export class LoyaltyRepository extends TenantScopedRepository {
  async findActiveConfig() {
    return this.db.loyaltyConfig.findFirst({
      where: { ...this.tenantWhere, isActive: true },
      orderBy: { createdAt: 'desc' },
    })
  }

  async createConfig(data: {
    pointsPerDollar: number
    redemptionRate: number
    pointsExpireMonths: number | null
    minPurchaseForPoints: number
    maxPointsPerPurchase: number | null
  }) {
    return this.db.loyaltyConfig.create({
      data: {
        ...this.tenantWhere,
        pointsPerDollar: data.pointsPerDollar,
        redemptionRate: data.redemptionRate,
        pointsExpireMonths: data.pointsExpireMonths,
        minPurchaseForPoints: data.minPurchaseForPoints,
        maxPointsPerPurchase: data.maxPointsPerPurchase,
        isActive: true,
      },
    })
  }

  async deactivateOtherActiveConfigs(currentConfigId: string): Promise<void> {
    await this.db.loyaltyConfig.updateMany({
      where: { ...this.tenantWhere, id: { not: currentConfigId }, isActive: true },
      data: { isActive: false },
    })
  }

  async findTransactionsByCustomerId(customerId: string) {
    return this.db.loyaltyPoint.findMany({
      where: { ...this.tenantWhere, customerId },
      orderBy: { createdAt: 'desc' },
    })
  }

  async createEarnedPoints(input: {
    customerId: string
    points: number
    saleId: string
    description: string
    expiresAt: Date | null
  }) {
    return this.db.loyaltyPoint.create({
      data: {
        ...this.tenantWhere,
        customerId: input.customerId,
        type: 'EARNED',
        points: input.points,
        description: input.description,
        saleId: input.saleId,
        expiresAt: input.expiresAt,
      },
    })
  }
}
