import { describe, it, expect } from 'vitest'
import { parsePagination, paginatedResult } from '../../common/database/pagination.js'

describe('parsePagination', () => {
  it('defaults to page 1, limit 20', () => {
    const result = parsePagination({})
    expect(result).toEqual({ page: 1, limit: 20, skip: 0 })
  })

  it('parses string page and limit', () => {
    const result = parsePagination({ page: '3', limit: '10' })
    expect(result).toEqual({ page: 3, limit: 10, skip: 20 })
  })

  it('clamps page to minimum 1', () => {
    const result = parsePagination({ page: '-5' })
    expect(result.page).toBe(1)
  })

  it('clamps limit to maximum 100', () => {
    const result = parsePagination({ limit: '500' })
    expect(result.limit).toBe(100)
  })

  it('falls back to default when limit is 0 (falsy)', () => {
    const result = parsePagination({ limit: '0' })
    expect(result.limit).toBe(20)
  })

  it('handles numeric page/limit', () => {
    const result = parsePagination({ page: 2, limit: 25 })
    expect(result).toEqual({ page: 2, limit: 25, skip: 25 })
  })
})

describe('paginatedResult', () => {
  it('wraps items with pagination metadata', () => {
    const items = [{ id: '1' }, { id: '2' }]
    const result = paginatedResult(items, 50, 1, 20)
    expect(result).toEqual({
      items,
      page: 1,
      limit: 20,
      total: 50,
      totalPages: 3,
    })
  })

  it('calculates totalPages correctly with exact division', () => {
    const result = paginatedResult([], 100, 1, 25)
    expect(result.totalPages).toBe(4)
  })

  it('rounds up totalPages', () => {
    const result = paginatedResult([], 101, 1, 25)
    expect(result.totalPages).toBe(5)
  })
})
