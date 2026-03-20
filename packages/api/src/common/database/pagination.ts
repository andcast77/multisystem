export type PaginationParams = {
  page?: string | number
  limit?: string | number
}

export type PaginationOptions = {
  defaultLimit?: number
  maxLimit?: number
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

export function parsePagination(
  params: PaginationParams,
  opts?: PaginationOptions
): { page: number; limit: number; skip: number } {
  const maxLimit = opts?.maxLimit != null ? Math.max(1, opts.maxLimit) : MAX_LIMIT
  const defaultLimit = opts?.defaultLimit != null ? Math.max(1, opts.defaultLimit) : DEFAULT_LIMIT
  const page = Math.max(1, parseInt(String(params.page ?? '1'), 10) || 1)
  const limit = Math.min(maxLimit, Math.max(1, parseInt(String(params.limit ?? defaultLimit), 10) || defaultLimit))
  return { page, limit, skip: (page - 1) * limit }
}

export function paginatedResult<T>(items: T[], total: number, page: number, limit: number): PaginatedResult<T> {
  return { items, page, limit, total, totalPages: Math.ceil(total / limit) }
}
