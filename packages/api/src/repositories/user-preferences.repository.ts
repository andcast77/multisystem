import { TenantScopedRepository } from '../common/database/index.js'

export class UserPreferencesRepository extends TenantScopedRepository {
  async findByUserId(userId: string) {
    return this.db.userPreferences.findUnique({
      where: { userId_companyId: { userId, companyId: this.tenantId } },
    })
  }

  async findIdByUserId(userId: string) {
    return this.db.userPreferences.findUnique({
      where: { userId_companyId: { userId, companyId: this.tenantId } },
      select: { id: true },
    })
  }

  async create(userId: string, language: string) {
    return this.db.userPreferences.create({
      data: { userId, companyId: this.tenantId, language },
    })
  }

  async updateLanguage(userId: string, language: string) {
    return this.db.userPreferences.update({
      where: { userId_companyId: { userId, companyId: this.tenantId } },
      data: { language },
    })
  }
}
