/**
 * Unit tests for account.service (PLAN-22 — GDPR rights).
 *
 * Covers:
 *  - exportMyData: shape, NotFoundError on missing user
 *  - acceptPrivacy: timestamp recorded, NotFoundError on missing user
 *  - anonymizeMyData: NotFoundError, ForbiddenError for sole owner,
 *    full anonymization transaction, permits deletion when other owners exist
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Hoisted mocks ────────────────────────────────────────────────────────────

const {
  mockUserFindUnique,
  mockUserUpdate,
  mockCompanyMemberFindMany,
  mockCompanyMemberCount,
  mockUserPreferencesFindMany,
  mockAuditLogFindMany,
  mockAuditLogUpdateMany,
  mockSaleFindMany,
  mockActionHistoryFindMany,
  mockSessionDeleteMany,
  mockPushSubDeleteMany,
  mockNotifPrefDeleteMany,
  mockTransaction,
} = vi.hoisted(() => ({
  mockUserFindUnique: vi.fn(),
  mockUserUpdate: vi.fn(),
  mockCompanyMemberFindMany: vi.fn(),
  mockCompanyMemberCount: vi.fn(),
  mockUserPreferencesFindMany: vi.fn(),
  mockAuditLogFindMany: vi.fn(),
  mockAuditLogUpdateMany: vi.fn(),
  mockSaleFindMany: vi.fn(),
  mockActionHistoryFindMany: vi.fn(),
  mockSessionDeleteMany: vi.fn(),
  mockPushSubDeleteMany: vi.fn(),
  mockNotifPrefDeleteMany: vi.fn(),
  mockTransaction: vi.fn(),
}))

// Transaction mock: immediately invoke the callback with a transactional client
const mockTx = {
  auditLog: { updateMany: mockAuditLogUpdateMany },
  user: { update: mockUserUpdate },
  session: { deleteMany: mockSessionDeleteMany },
  pushSubscription: { deleteMany: mockPushSubDeleteMany },
  notificationPreference: { deleteMany: mockNotifPrefDeleteMany },
}

vi.mock('../../db/index.js', () => ({
  prisma: {
    user: { findUnique: mockUserFindUnique, update: mockUserUpdate },
    companyMember: { findMany: mockCompanyMemberFindMany, count: mockCompanyMemberCount },
    userPreferences: { findMany: mockUserPreferencesFindMany },
    auditLog: { findMany: mockAuditLogFindMany, updateMany: mockAuditLogUpdateMany },
    sale: { findMany: mockSaleFindMany },
    actionHistory: { findMany: mockActionHistoryFindMany },
    $transaction: mockTransaction,
  },
  Prisma: {},
}))

import {
  exportMyData,
  acceptPrivacy,
  anonymizeMyData,
} from '../../services/account.service.js'

const USER_ID = 'user-test-001'

const baseUser = {
  id: USER_ID,
  email: 'alice@example.com',
  firstName: 'Alice',
  lastName: 'Smith',
  phone: '+1234567890',
  role: 'USER',
  isActive: true,
  privacyAcceptedAt: null,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-06-01'),
}

// ─── exportMyData ─────────────────────────────────────────────────────────────

describe('exportMyData', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws NotFoundError when user does not exist', async () => {
    mockUserFindUnique.mockResolvedValue(null)
    await expect(exportMyData(USER_ID)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('returns correct top-level shape for a known user', async () => {
    mockUserFindUnique.mockResolvedValue(baseUser)
    mockCompanyMemberFindMany.mockResolvedValue([
      { companyId: 'c1', membershipRole: 'OWNER', createdAt: new Date(), company: { name: 'Acme' } },
    ])
    mockUserPreferencesFindMany.mockResolvedValue([{ companyId: 'c1', language: 'es' }])
    mockAuditLogFindMany.mockResolvedValue([])
    mockSaleFindMany.mockResolvedValue([])
    mockActionHistoryFindMany.mockResolvedValue([])

    const result = await exportMyData(USER_ID)

    expect(result.exportedAt).toBeDefined()
    expect(result.profile.id).toBe(USER_ID)
    expect(result.profile.email).toBe('alice@example.com')
    expect(result.memberships).toHaveLength(1)
    expect(result.memberships[0].companyName).toBe('Acme')
    expect(result.preferences).toHaveLength(1)
    expect(result.auditLogs).toHaveLength(0)
    expect(result.recentSales).toHaveLength(0)
    expect(result.actionHistory).toHaveLength(0)
  })

  it('does not expose password or twoFactorSecret in the profile', async () => {
    mockUserFindUnique.mockResolvedValue(baseUser)
    mockCompanyMemberFindMany.mockResolvedValue([])
    mockUserPreferencesFindMany.mockResolvedValue([])
    mockAuditLogFindMany.mockResolvedValue([])
    mockSaleFindMany.mockResolvedValue([])
    mockActionHistoryFindMany.mockResolvedValue([])

    const result = await exportMyData(USER_ID)

    expect((result.profile as any).password).toBeUndefined()
    expect((result.profile as any).twoFactorSecret).toBeUndefined()
  })

  it('maps membership joinedAt from companyMember.createdAt', async () => {
    const joinedAt = new Date('2025-03-15')
    mockUserFindUnique.mockResolvedValue(baseUser)
    mockCompanyMemberFindMany.mockResolvedValue([
      { companyId: 'c1', membershipRole: 'ADMIN', createdAt: joinedAt, company: { name: 'Beta' } },
    ])
    mockUserPreferencesFindMany.mockResolvedValue([])
    mockAuditLogFindMany.mockResolvedValue([])
    mockSaleFindMany.mockResolvedValue([])
    mockActionHistoryFindMany.mockResolvedValue([])

    const result = await exportMyData(USER_ID)
    expect(result.memberships[0].joinedAt).toEqual(joinedAt)
    expect(result.memberships[0].membershipRole).toBe('ADMIN')
  })
})

// ─── acceptPrivacy ────────────────────────────────────────────────────────────

describe('acceptPrivacy', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws NotFoundError when user does not exist', async () => {
    mockUserFindUnique.mockResolvedValue(null)
    await expect(acceptPrivacy(USER_ID)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('updates privacyAcceptedAt and returns its value', async () => {
    const now = new Date()
    mockUserFindUnique.mockResolvedValue({ id: USER_ID, privacyAcceptedAt: null })
    mockUserUpdate.mockResolvedValue({ privacyAcceptedAt: now })

    const result = await acceptPrivacy(USER_ID)

    expect(mockUserUpdate).toHaveBeenCalledWith({
      where: { id: USER_ID },
      data: { privacyAcceptedAt: expect.any(Date) },
      select: { privacyAcceptedAt: true },
    })
    expect(result.privacyAcceptedAt).toEqual(now)
  })

  it('allows re-accepting privacy (idempotent)', async () => {
    const previous = new Date('2024-01-01')
    const now = new Date()
    mockUserFindUnique.mockResolvedValue({ id: USER_ID, privacyAcceptedAt: previous })
    mockUserUpdate.mockResolvedValue({ privacyAcceptedAt: now })

    const result = await acceptPrivacy(USER_ID)
    expect(result.privacyAcceptedAt).toEqual(now)
    expect(mockUserUpdate).toHaveBeenCalledOnce()
  })
})

// ─── anonymizeMyData ──────────────────────────────────────────────────────────

describe('anonymizeMyData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: transaction calls the callback immediately with mockTx
    mockTransaction.mockImplementation((fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx))
    mockAuditLogUpdateMany.mockResolvedValue({ count: 5 })
    mockUserUpdate.mockResolvedValue({})
    mockSessionDeleteMany.mockResolvedValue({ count: 2 })
    mockPushSubDeleteMany.mockResolvedValue({ count: 1 })
    mockNotifPrefDeleteMany.mockResolvedValue({ count: 1 })
  })

  it('throws NotFoundError when user does not exist', async () => {
    mockUserFindUnique.mockResolvedValue(null)
    await expect(anonymizeMyData(USER_ID)).rejects.toMatchObject({ statusCode: 404 })
    expect(mockTransaction).not.toHaveBeenCalled()
  })

  it('throws ForbiddenError with SOLE_OWNER code when user is sole owner of a company', async () => {
    mockUserFindUnique.mockResolvedValue({ id: USER_ID, isActive: true })
    mockCompanyMemberFindMany.mockResolvedValue([{ companyId: 'c1' }])
    mockCompanyMemberCount.mockResolvedValue(0) // no other owners

    await expect(anonymizeMyData(USER_ID)).rejects.toMatchObject({
      statusCode: 403,
      code: 'SOLE_OWNER',
    })
    expect(mockTransaction).not.toHaveBeenCalled()
  })

  it('proceeds when user is owner alongside another owner', async () => {
    mockUserFindUnique.mockResolvedValue({ id: USER_ID, isActive: true })
    mockCompanyMemberFindMany.mockResolvedValue([{ companyId: 'c1' }])
    mockCompanyMemberCount.mockResolvedValue(1) // another owner exists

    const result = await anonymizeMyData(USER_ID)

    expect(mockTransaction).toHaveBeenCalledOnce()
    expect(result.anonymized).toBe(true)
  })

  it('proceeds when user has no OWNER memberships at all', async () => {
    mockUserFindUnique.mockResolvedValue({ id: USER_ID, isActive: true })
    mockCompanyMemberFindMany.mockResolvedValue([]) // no owner memberships

    const result = await anonymizeMyData(USER_ID)

    expect(mockTransaction).toHaveBeenCalledOnce()
    expect(result.anonymized).toBe(true)
  })

  it('nullifies userId in audit logs inside the transaction', async () => {
    mockUserFindUnique.mockResolvedValue({ id: USER_ID, isActive: true })
    mockCompanyMemberFindMany.mockResolvedValue([])

    await anonymizeMyData(USER_ID)

    expect(mockAuditLogUpdateMany).toHaveBeenCalledWith({
      where: { userId: USER_ID },
      data: { userId: null },
    })
  })

  it('anonymizes email, name, and deactivates account inside the transaction', async () => {
    mockUserFindUnique.mockResolvedValue({ id: USER_ID, isActive: true })
    mockCompanyMemberFindMany.mockResolvedValue([])

    await anonymizeMyData(USER_ID)

    const updateCall = mockUserUpdate.mock.calls[0][0]
    expect(updateCall.where).toEqual({ id: USER_ID })
    expect(updateCall.data.email).toMatch(/^deleted_.*@deleted\.local$/)
    expect(updateCall.data.firstName).toBe('[Eliminado]')
    expect(updateCall.data.lastName).toBe('[Eliminado]')
    expect(updateCall.data.phone).toBeNull()
    expect(updateCall.data.isActive).toBe(false)
    expect(updateCall.data.twoFactorEnabled).toBe(false)
    expect(updateCall.data.twoFactorSecret).toBeNull()
  })

  it('deletes sessions, push subscriptions, and notification preferences in the transaction', async () => {
    mockUserFindUnique.mockResolvedValue({ id: USER_ID, isActive: true })
    mockCompanyMemberFindMany.mockResolvedValue([])

    await anonymizeMyData(USER_ID)

    expect(mockSessionDeleteMany).toHaveBeenCalledWith({ where: { userId: USER_ID } })
    expect(mockPushSubDeleteMany).toHaveBeenCalledWith({ where: { userId: USER_ID } })
    expect(mockNotifPrefDeleteMany).toHaveBeenCalledWith({ where: { userId: USER_ID } })
  })

  it('anonymized email is unique (contains a UUID each call)', async () => {
    mockUserFindUnique.mockResolvedValue({ id: USER_ID, isActive: true })
    mockCompanyMemberFindMany.mockResolvedValue([])

    await anonymizeMyData(USER_ID)
    const firstEmail = mockUserUpdate.mock.calls[0][0].data.email

    vi.clearAllMocks()
    mockUserFindUnique.mockResolvedValue({ id: USER_ID, isActive: true })
    mockCompanyMemberFindMany.mockResolvedValue([])
    mockTransaction.mockImplementation((fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx))
    mockAuditLogUpdateMany.mockResolvedValue({ count: 0 })
    mockUserUpdate.mockResolvedValue({})
    mockSessionDeleteMany.mockResolvedValue({ count: 0 })
    mockPushSubDeleteMany.mockResolvedValue({ count: 0 })
    mockNotifPrefDeleteMany.mockResolvedValue({ count: 0 })

    await anonymizeMyData(USER_ID)
    const secondEmail = mockUserUpdate.mock.calls[0][0].data.email

    expect(firstEmail).not.toBe(secondEmail)
  })

  it('returns anonymized=true and a descriptive message', async () => {
    mockUserFindUnique.mockResolvedValue({ id: USER_ID, isActive: true })
    mockCompanyMemberFindMany.mockResolvedValue([])

    const result = await anonymizeMyData(USER_ID)
    expect(result.anonymized).toBe(true)
    expect(typeof result.message).toBe('string')
    expect(result.message.length).toBeGreaterThan(0)
  })
})
