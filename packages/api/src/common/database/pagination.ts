export type PaginationParams = {
  page?: string | number
  limit?: string | number
}

export type PaginatedResult<T> = {
  items: T[]
  page: number
  limit: number
  total: number
  totalPages: number
}

const MAX_LIMIT = 100
const DEFAULT_LIMIT = 20

export function parsePagination(params: PaginationParams): { page: number; limit: number; skip: number } {
  const page = Math.max(1, parseInt(String(params.page ?? '1'), 10) || 1)
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(String(params.limit ?? DEFAULT_LIMIT), 10) || DEFAULT_LIMIT))
  return { page, limit, skip: (page - 1) * limit }
}

export function paginatedResult<T>(items: T[], total: number, page: number, limit: number): PaginatedResult<T> {
  return { items, page, limit, total, totalPages: Math.ceil(total / limit) }
}
