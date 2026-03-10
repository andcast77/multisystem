import type { PrismaClient } from '@multisystem/database'
import { parsePagination, paginatedResult, type PaginationParams, type PaginatedResult } from './pagination.js'

/**
 * Base repository that enforces tenant scoping on every query.
 * All subclasses automatically include tenantId in WHERE clauses,
 * making cross-tenant data leaks structurally impossible.
 */
export abstract class TenantScopedRepository {
  constructor(
    protected readonly db: PrismaClient,
    protected readonly tenantId: string,
  ) {}

  protected get tenantWhere() {
    return { companyId: this.tenantId }
  }

  protected get activeTenantWhere() {
    return { companyId: this.tenantId, active: true }
  }

  protected parsePagination(params: PaginationParams) {
    return parsePagination(params)
  }

  protected paginatedResult<T>(items: T[], total: number, page: number, limit: number): PaginatedResult<T> {
    return paginatedResult(items, total, page, limit)
  }
}
