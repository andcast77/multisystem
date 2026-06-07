import type { PaginatedResult } from './database/index.js'

/**
 * Standardized API response envelope used across all modules.
 * All endpoints return this shape for consistency.
 */
export type ApiResponse<T = unknown> = {
  success: true
  data: T
} | {
  success: false
  error: string
  code?: string
  details?: unknown
}

export type PaginatedApiResponse<T> = {
  success: true
  data: T[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export function ok<T>(data: T): { success: true; data: T } {
  return { success: true, data }
}

export function paginated<T>(result: PaginatedResult<T>): PaginatedApiResponse<T> {
  return {
    success: true,
    data: result.items,
    meta: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    },
  }
}

export function fail(error: string, code?: string): { success: false; error: string; code?: string } {
  return { success: false, error, code }
}
