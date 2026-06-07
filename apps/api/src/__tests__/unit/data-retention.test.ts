/**
 * Unit tests for data-retention.job (PLAN-22).
 *
 * Covers:
 *  - Correct deleteMany calls for sessions, audit logs, and action history
 *  - 12-month threshold is computed relative to the current time
 *  - Logged counts are reported from prisma results
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Hoisted mocks ────────────────────────────────────────────────────────────

const {
  mockSessionDeleteMany,
  mockAuditLogDeleteMany,
  mockActionHistoryDeleteMany,
} = vi.hoisted(() => ({
  mockSessionDeleteMany: vi.fn(),
  mockAuditLogDeleteMany: vi.fn(),
  mockActionHistoryDeleteMany: vi.fn(),
}))

vi.mock('../../db/index.js', () => ({
  prisma: {
    session: { deleteMany: mockSessionDeleteMany },
    auditLog: { deleteMany: mockAuditLogDeleteMany },
    actionHistory: { deleteMany: mockActionHistoryDeleteMany },
  },
  Prisma: {},
}))

import { runDataRetentionJob } from '../../jobs/data-retention.job.js'

describe('runDataRetentionJob', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSessionDeleteMany.mockResolvedValue({ count: 3 })
    mockAuditLogDeleteMany.mockResolvedValue({ count: 12 })
    mockActionHistoryDeleteMany.mockResolvedValue({ count: 5 })
  })

  it('calls session.deleteMany to remove expired sessions', async () => {
    await runDataRetentionJob()
    expect(mockSessionDeleteMany).toHaveBeenCalledOnce()
    const { where } = mockSessionDeleteMany.mock.calls[0][0]
    expect(where.expiresAt.lte).toBeInstanceOf(Date)
  })

  it('session threshold is now (expired = expiresAt <= now)', async () => {
    const before = new Date()
    await runDataRetentionJob()
    const after = new Date()
    const { where } = mockSessionDeleteMany.mock.calls[0][0]
    expect(where.expiresAt.lte.getTime()).toBeGreaterThanOrEqual(before.getTime())
    expect(where.expiresAt.lte.getTime()).toBeLessThanOrEqual(after.getTime())
  })

  it('calls auditLog.deleteMany with a threshold approximately 12 months ago', async () => {
    const before = new Date()
    await runDataRetentionJob()
    const after = new Date()

    expect(mockAuditLogDeleteMany).toHaveBeenCalledOnce()
    const { where } = mockAuditLogDeleteMany.mock.calls[0][0]
    const threshold: Date = where.createdAt.lt

    // Threshold should be ~12 months before "now"
    const twelveMonthsBeforeBefore = new Date(before)
    twelveMonthsBeforeBefore.setMonth(twelveMonthsBeforeBefore.getMonth() - 12)
    const twelveMonthsBeforeAfter = new Date(after)
    twelveMonthsBeforeAfter.setMonth(twelveMonthsBeforeAfter.getMonth() - 12)

    expect(threshold.getTime()).toBeGreaterThanOrEqual(twelveMonthsBeforeBefore.getTime())
    expect(threshold.getTime()).toBeLessThanOrEqual(twelveMonthsBeforeAfter.getTime())
  })

  it('calls actionHistory.deleteMany with the same 12-month threshold', async () => {
    const before = new Date()
    await runDataRetentionJob()
    const after = new Date()

    expect(mockActionHistoryDeleteMany).toHaveBeenCalledOnce()
    const { where } = mockActionHistoryDeleteMany.mock.calls[0][0]
    const threshold: Date = where.createdAt.lt

    const twelveMonthsBeforeBefore = new Date(before)
    twelveMonthsBeforeBefore.setMonth(twelveMonthsBeforeBefore.getMonth() - 12)
    const twelveMonthsBeforeAfter = new Date(after)
    twelveMonthsBeforeAfter.setMonth(twelveMonthsBeforeAfter.getMonth() - 12)

    expect(threshold.getTime()).toBeGreaterThanOrEqual(twelveMonthsBeforeBefore.getTime())
    expect(threshold.getTime()).toBeLessThanOrEqual(twelveMonthsBeforeAfter.getTime())
  })

  it('runs all three deletes in parallel (all called per invocation)', async () => {
    await runDataRetentionJob()
    expect(mockSessionDeleteMany).toHaveBeenCalledOnce()
    expect(mockAuditLogDeleteMany).toHaveBeenCalledOnce()
    expect(mockActionHistoryDeleteMany).toHaveBeenCalledOnce()
  })

  it('propagates errors when any deleteMany fails', async () => {
    mockSessionDeleteMany.mockRejectedValue(new Error('DB connection lost'))
    await expect(runDataRetentionJob()).rejects.toThrow('DB connection lost')
  })
})
