import { describe, it, expect } from 'vitest'
import { ok, fail, paginated } from '../../common/api-response.js'

describe('API response helpers', () => {
  it('ok() wraps data with success: true', () => {
    const result = ok({ id: '123', name: 'Test' })
    expect(result).toEqual({
      success: true,
      data: { id: '123', name: 'Test' },
    })
  })

  it('fail() creates error response', () => {
    const result = fail('Something went wrong', 'ERR_CODE')
    expect(result).toEqual({
      success: false,
      error: 'Something went wrong',
      code: 'ERR_CODE',
    })
  })

  it('paginated() creates standardized paginated response', () => {
    const result = paginated({
      items: [{ id: '1' }, { id: '2' }],
      page: 1,
      limit: 20,
      total: 50,
      totalPages: 3,
    })
    expect(result).toEqual({
      success: true,
      data: [{ id: '1' }, { id: '2' }],
      meta: {
        page: 1,
        limit: 20,
        total: 50,
        totalPages: 3,
      },
    })
  })
})
