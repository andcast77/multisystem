/**
 * Unit tests for audit-log.service.ts
 *
 * Covers:
 *  - writeAuditLog is fire-and-forget: returns void, never throws (even on DB error)
 *  - listAuditLogs pagination math
 *  - listAuditLogs filter construction
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ------------------------------------------------------------------
// Prisma mock setup — vi.hoisted ensures refs are available inside the
// vi.mock factory (which is hoisted to the top of the file by vitest).
// ------------------------------------------------------------------
const { mockCreate, mockCount, mockFindMany, mockUserFindMany } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
  mockCount: vi.fn(),
  mockFindMany: vi.fn(),
  mockUserFindMany: vi.fn(),
}))

vi.mock('../../db/index.js', () => ({
  prisma: {
    auditLog: {
      create: mockCreate,
      count: mockCount,
      findMany: mockFindMany,
    },
    user: {
      findMany: mockUserFindMany,
    },
  },
  Prisma: {},
}))

import { writeAuditLog, listAuditLogs } from '../../services/audit-log.service.js'

// Helper: flush the event loop so setImmediate callbacks can fire
function flushImmediate() {
  return new Promise<void>((resolve) => setImmediate(resolve))
}

describe('writeAuditLog — fire-and-forget', () => {
  beforeEach(async () => {
    // Drain any pending setImmediate callbacks from previous tests before resetting mocks
    await flushImmediate()
    vi.clearAllMocks()
  })

  it('returns undefined immediately (does not await DB)', () => {
    mockCreate.mockResolvedValue({ id: 'mock-id' })
    const result = writeAuditLog({
      companyId: 'company-1',
      userId: 'user-1',
      action: 'LOGIN_SUCCESS',
      entityType: 'auth',
    })
    expect(result).toBeUndefined()
    // prisma.create must NOT have been called yet (deferred via setImmediate)
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('calls prisma.auditLog.create after the event loop yields', async () => {
    mockCreate.mockResolvedValue({ id: 'mock-id' })
    writeAuditLog({
      companyId: 'company-1',
      userId: 'user-1',
      action: 'LOGIN_SUCCESS',
      entityType: 'auth',
      entityId: 'user-1',
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent',
    })
    await flushImmediate()
    expect(mockCreate).toHaveBeenCalledOnce()
    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        companyId: 'company-1',
        userId: 'user-1',
        action: 'LOGIN_SUCCESS',
        entityType: 'auth',
        entityId: 'user-1',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
      }),
    })
  })

  it('does not throw when prisma.create rejects (error is swallowed)', async () => {
    mockCreate.mockRejectedValue(new Error('DB connection lost'))
    // Should never throw — fire and forget
    expect(() =>
      writeAuditLog({
        companyId: 'company-x',
        action: 'USER_CREATED',
        entityType: 'user',
      })
    ).not.toThrow()
    // Let the rejected promise settle — must not surface as unhandled rejection
    await flushImmediate()
    await new Promise((r) => setTimeout(r, 10))
  })

  it('persists null companyId for platform-scoped events', async () => {
    mockCreate.mockResolvedValue({ id: 'mock-id' })
    writeAuditLog({
      companyId: null,
      userId: 'user-orphan',
      action: 'LOGIN_FAILED',
      entityType: 'auth',
    })
    await flushImmediate()
    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        companyId: null,
        userId: 'user-orphan',
        action: 'LOGIN_FAILED',
        entityType: 'auth',
      }),
    })
  })

  it('maps null before/after to undefined (omits from Prisma input)', async () => {
    mockCreate.mockResolvedValue({ id: 'mock-id' })
    writeAuditLog({
      companyId: 'company-1',
      action: 'USER_DELETED',
      entityType: 'user',
      before: null,
      after: null,
    })
    await flushImmediate()
    const call = mockCreate.mock.calls[0][0]
    expect(call.data.before).toBeUndefined()
    expect(call.data.after).toBeUndefined()
  })

  it('passes before/after JSON through when provided', async () => {
    mockCreate.mockResolvedValue({ id: 'mock-id' })
    writeAuditLog({
      companyId: 'company-1',
      action: 'USER_UPDATED',
      entityType: 'user',
      before: { email: 'old@example.com' },
      after: { email: 'new@example.com' },
    })
    await flushImmediate()
    const call = mockCreate.mock.calls[0][0]
    expect(call.data.before).toEqual({ email: 'old@example.com' })
    expect(call.data.after).toEqual({ email: 'new@example.com' })
  })
})

describe('listAuditLogs — pagination', () => {
  const companyId = 'company-test'

  beforeEach(() => {
    vi.clearAllMocks()
    mockCount.mockResolvedValue(0)
    mockFindMany.mockResolvedValue([])
    mockUserFindMany.mockResolvedValue([])
  })

  it('defaults to page 1, pageSize 20', async () => {
    mockCount.mockResolvedValue(0)
    const result = await listAuditLogs(companyId, {})
    expect(result.pagination.page).toBe(1)
    expect(result.pagination.pageSize).toBe(20)
    const findManyCall = mockFindMany.mock.calls[0][0]
    expect(findManyCall.skip).toBe(0)
    expect(findManyCall.take).toBe(20)
  })

  it('calculates skip correctly for page 2', async () => {
    mockCount.mockResolvedValue(50)
    const result = await listAuditLogs(companyId, { page: '2', pageSize: '10' })
    expect(result.pagination.page).toBe(2)
    expect(result.pagination.pageSize).toBe(10)
    expect(result.pagination.totalPages).toBe(5)
    const findManyCall = mockFindMany.mock.calls[0][0]
    expect(findManyCall.skip).toBe(10)
    expect(findManyCall.take).toBe(10)
  })

  it('clamps pageSize to max 100', async () => {
    mockCount.mockResolvedValue(0)
    await listAuditLogs(companyId, { pageSize: '999' })
    const findManyCall = mockFindMany.mock.calls[0][0]
    expect(findManyCall.take).toBe(100)
  })

  it('clamps page to min 1 when given invalid value', async () => {
    mockCount.mockResolvedValue(0)
    const result = await listAuditLogs(companyId, { page: '-5' })
    expect(result.pagination.page).toBe(1)
  })

  it('always scopes query by companyId', async () => {
    mockCount.mockResolvedValue(0)
    await listAuditLogs(companyId, {})
    const countCall = mockCount.mock.calls[0][0]
    expect(countCall.where.companyId).toBe(companyId)
    const findManyCall = mockFindMany.mock.calls[0][0]
    expect(findManyCall.where.companyId).toBe(companyId)
  })
})

describe('listAuditLogs — filters', () => {
  const companyId = 'company-filter-test'

  beforeEach(() => {
    vi.clearAllMocks()
    mockCount.mockResolvedValue(0)
    mockFindMany.mockResolvedValue([])
    mockUserFindMany.mockResolvedValue([])
  })

  it('applies entityType filter', async () => {
    await listAuditLogs(companyId, { entityType: 'user' })
    const countCall = mockCount.mock.calls[0][0]
    expect(countCall.where.entityType).toBe('user')
  })

  it('applies action filter', async () => {
    await listAuditLogs(companyId, { action: 'LOGIN_SUCCESS' })
    const countCall = mockCount.mock.calls[0][0]
    expect(countCall.where.action).toBe('LOGIN_SUCCESS')
  })

  it('applies userId filter', async () => {
    await listAuditLogs(companyId, { userId: 'user-abc' })
    const countCall = mockCount.mock.calls[0][0]
    expect(countCall.where.userId).toBe('user-abc')
  })

  it('applies dateFrom filter as gte', async () => {
    await listAuditLogs(companyId, { dateFrom: '2026-01-01' })
    const countCall = mockCount.mock.calls[0][0]
    expect(countCall.where.createdAt?.gte).toEqual(new Date('2026-01-01'))
    expect(countCall.where.createdAt?.lte).toBeUndefined()
  })

  it('applies dateTo filter as lte', async () => {
    await listAuditLogs(companyId, { dateTo: '2026-12-31' })
    const countCall = mockCount.mock.calls[0][0]
    expect(countCall.where.createdAt?.lte).toEqual(new Date('2026-12-31'))
    expect(countCall.where.createdAt?.gte).toBeUndefined()
  })

  it('applies both dateFrom and dateTo', async () => {
    await listAuditLogs(companyId, { dateFrom: '2026-01-01', dateTo: '2026-06-30' })
    const countCall = mockCount.mock.calls[0][0]
    expect(countCall.where.createdAt?.gte).toEqual(new Date('2026-01-01'))
    expect(countCall.where.createdAt?.lte).toEqual(new Date('2026-06-30'))
  })

  it('omits entityType/action/userId from where when not provided', async () => {
    await listAuditLogs(companyId, {})
    const countCall = mockCount.mock.calls[0][0]
    expect(countCall.where.entityType).toBeUndefined()
    expect(countCall.where.action).toBeUndefined()
    expect(countCall.where.userId).toBeUndefined()
    expect(countCall.where.createdAt).toBeUndefined()
  })
})

describe('listAuditLogs — user enrichment', () => {
  const companyId = 'company-enrich-test'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('enriches items with user data from a secondary query', async () => {
    const userId = 'user-enrichment-123'
    mockCount.mockResolvedValue(1)
    mockFindMany.mockResolvedValue([
      {
        id: 'log-1',
        action: 'USER_CREATED',
        entityType: 'user',
        entityId: null,
        before: null,
        after: null,
        ipAddress: null,
        userAgent: null,
        createdAt: new Date('2026-04-01T10:00:00Z'),
        userId,
      },
    ])
    mockUserFindMany.mockResolvedValue([
      { id: userId, email: 'alice@example.com', firstName: 'Alice', lastName: 'Smith' },
    ])

    const result = await listAuditLogs(companyId, {})
    expect(result.items).toHaveLength(1)
    expect(result.items[0].user).toEqual({
      id: userId,
      email: 'alice@example.com',
      firstName: 'Alice',
      lastName: 'Smith',
    })
  })

  it('sets user to null when userId is null', async () => {
    mockCount.mockResolvedValue(1)
    mockFindMany.mockResolvedValue([
      {
        id: 'log-2',
        action: 'LOGIN_FAILED',
        entityType: 'auth',
        entityId: null,
        before: null,
        after: null,
        ipAddress: '1.2.3.4',
        userAgent: null,
        createdAt: new Date(),
        userId: null,
      },
    ])
    mockUserFindMany.mockResolvedValue([])

    const result = await listAuditLogs(companyId, {})
    expect(result.items[0].user).toBeNull()
    // No user query should be made for empty userId list
    expect(mockUserFindMany).not.toHaveBeenCalled()
  })

  it('skips user query when all items have null userId', async () => {
    mockCount.mockResolvedValue(1)
    mockFindMany.mockResolvedValue([
      { id: 'log-3', action: 'LOGIN_FAILED', entityType: 'auth', entityId: null, before: null, after: null, ipAddress: null, userAgent: null, createdAt: new Date(), userId: null },
    ])
    await listAuditLogs(companyId, {})
    expect(mockUserFindMany).not.toHaveBeenCalled()
  })
})
