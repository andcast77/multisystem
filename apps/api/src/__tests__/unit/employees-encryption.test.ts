/**
 * Unit tests for field-level encryption in employees.service.ts
 *
 * Covers:
 *  - listEmployees decrypts idNumber on read
 *  - listEmployees falls back to plaintext when key is absent
 *  - listEmployees uses idNumberHash for search when key is present
 *  - listEmployees falls back to plaintext contains search when key is absent
 *  - getEmployeeById decrypts idNumber on read
 *  - createEmployee encrypts idNumber and sets idNumberHash
 *  - createEmployee stores null idNumberHash when key is absent
 *  - updateEmployee re-encrypts idNumber on update
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { encryptField, hashForSearch } from '../../common/crypto/field-encryption.js'

const TEST_KEY = Buffer.alloc(32, 'k')
const TEST_KEY_B64 = TEST_KEY.toString('base64')

// ----------------------------------------------------------------
// Prisma mock
// ----------------------------------------------------------------
const { mockCount, mockFindMany, mockFindFirst, mockCreate, mockUpdate } = vi.hoisted(() => ({
  mockCount: vi.fn(),
  mockFindMany: vi.fn(),
  mockFindFirst: vi.fn(),
  mockCreate: vi.fn(),
  mockUpdate: vi.fn(),
}))

vi.mock('../../db/index.js', () => ({
  prisma: {
    employee: {
      count: mockCount,
      findMany: mockFindMany,
      findFirst: mockFindFirst,
      create: mockCreate,
      update: mockUpdate,
    },
  },
  Prisma: {},
}))

import {
  listEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
} from '../../services/employees.service.js'

const companyCtx = { companyId: 'company-1', userId: 'user-1', role: 'ADMIN' as const, isSuperuser: false }

function makeDbEmployee(overrides: Record<string, unknown> = {}) {
  return {
    id: 'emp-1',
    companyId: 'company-1',
    departmentId: null,
    positionId: null,
    userId: null,
    idNumber: null,
    idNumberHash: null,
    firstName: 'John',
    lastName: 'Doe',
    birthDate: null,
    gender: null,
    dateJoined: new Date('2024-01-01'),
    status: 'ACTIVE',
    customSalaryAmount: null,
    customSalaryType: null,
    customOvertimeEligible: false,
    isDeleted: false,
    deletedAt: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  }
}

describe('listEmployees — decryption on read', () => {
  const savedKey = process.env.FIELD_ENCRYPTION_KEY

  beforeEach(() => {
    mockCount.mockResolvedValue(1)
  })

  afterEach(() => {
    if (savedKey === undefined) delete process.env.FIELD_ENCRYPTION_KEY
    else process.env.FIELD_ENCRYPTION_KEY = savedKey
    vi.clearAllMocks()
  })

  it('decrypts idNumber when key is present', async () => {
    process.env.FIELD_ENCRYPTION_KEY = TEST_KEY_B64
    const encrypted = encryptField('12345678', TEST_KEY)
    mockFindMany.mockResolvedValue([makeDbEmployee({ idNumber: encrypted })])

    const { employees } = await listEmployees(companyCtx, {})
    expect(employees[0].idNumber).toBe('12345678')
  })

  it('returns plaintext idNumber as-is when key is absent', async () => {
    delete process.env.FIELD_ENCRYPTION_KEY
    mockFindMany.mockResolvedValue([makeDbEmployee({ idNumber: 'ABC-001' })])

    const { employees } = await listEmployees(companyCtx, {})
    expect(employees[0].idNumber).toBe('ABC-001')
  })

  it('returns plaintext idNumber as-is when value is not in encrypted format (legacy data)', async () => {
    process.env.FIELD_ENCRYPTION_KEY = TEST_KEY_B64
    mockFindMany.mockResolvedValue([makeDbEmployee({ idNumber: 'PLAIN-12345' })])

    const { employees } = await listEmployees(companyCtx, {})
    expect(employees[0].idNumber).toBe('PLAIN-12345')
  })

  it('returns null idNumber when field is null', async () => {
    process.env.FIELD_ENCRYPTION_KEY = TEST_KEY_B64
    mockFindMany.mockResolvedValue([makeDbEmployee({ idNumber: null })])

    const { employees } = await listEmployees(companyCtx, {})
    expect(employees[0].idNumber).toBeNull()
  })
})

describe('listEmployees — search path', () => {
  const savedKey = process.env.FIELD_ENCRYPTION_KEY

  beforeEach(() => {
    mockCount.mockResolvedValue(0)
    mockFindMany.mockResolvedValue([])
  })

  afterEach(() => {
    if (savedKey === undefined) delete process.env.FIELD_ENCRYPTION_KEY
    else process.env.FIELD_ENCRYPTION_KEY = savedKey
    vi.clearAllMocks()
  })

  it('uses idNumberHash when key is present and search is provided', async () => {
    process.env.FIELD_ENCRYPTION_KEY = TEST_KEY_B64
    await listEmployees(companyCtx, { search: 'ABC' })

    const [[{ where }]] = mockFindMany.mock.calls as any
    const expectedHash = hashForSearch('ABC', TEST_KEY)
    const hashClause = where.OR?.find((c: any) => c.idNumberHash !== undefined)
    expect(hashClause?.idNumberHash).toBe(expectedHash)
    expect(where.OR?.some((c: any) => c.idNumber !== undefined)).toBe(false)
  })

  it('falls back to idNumber contains search when key is absent', async () => {
    delete process.env.FIELD_ENCRYPTION_KEY
    await listEmployees(companyCtx, { search: 'ABC' })

    const [[{ where }]] = mockFindMany.mock.calls as any
    const idNumberClause = where.OR?.find((c: any) => c.idNumber !== undefined)
    expect(idNumberClause?.idNumber).toMatchObject({ contains: 'ABC' })
    expect(where.OR?.some((c: any) => c.idNumberHash !== undefined)).toBe(false)
  })
})

describe('getEmployeeById — decryption on read', () => {
  const savedKey = process.env.FIELD_ENCRYPTION_KEY

  afterEach(() => {
    if (savedKey === undefined) delete process.env.FIELD_ENCRYPTION_KEY
    else process.env.FIELD_ENCRYPTION_KEY = savedKey
    vi.clearAllMocks()
  })

  it('decrypts idNumber when key is present', async () => {
    process.env.FIELD_ENCRYPTION_KEY = TEST_KEY_B64
    const encrypted = encryptField('DOC-999', TEST_KEY)
    mockFindFirst.mockResolvedValue(makeDbEmployee({ idNumber: encrypted }))

    const employee = await getEmployeeById(companyCtx, 'emp-1')
    expect(employee?.idNumber).toBe('DOC-999')
  })

  it('returns null when employee is not found', async () => {
    process.env.FIELD_ENCRYPTION_KEY = TEST_KEY_B64
    mockFindFirst.mockResolvedValue(null)

    const employee = await getEmployeeById(companyCtx, 'non-existent')
    expect(employee).toBeNull()
  })
})

describe('createEmployee — encryption on write', () => {
  const savedKey = process.env.FIELD_ENCRYPTION_KEY

  afterEach(() => {
    if (savedKey === undefined) delete process.env.FIELD_ENCRYPTION_KEY
    else process.env.FIELD_ENCRYPTION_KEY = savedKey
    vi.clearAllMocks()
  })

  it('encrypts idNumber and sets idNumberHash when key is present', async () => {
    process.env.FIELD_ENCRYPTION_KEY = TEST_KEY_B64
    const plain = 'ID-112233'
    mockCreate.mockResolvedValue(makeDbEmployee({ idNumber: encryptField(plain, TEST_KEY), idNumberHash: hashForSearch(plain, TEST_KEY) }))

    await createEmployee(companyCtx, {
      companyId: 'company-1',
      firstName: 'Jane',
      lastName: 'Smith',
      idNumber: plain,
    })

    const [[{ data }]] = mockCreate.mock.calls as any
    expect(data.idNumber).not.toBe(plain)
    expect(data.idNumber.split(':').length).toBe(3)
    expect(data.idNumberHash).toBe(hashForSearch(plain, TEST_KEY))
  })

  it('stores plaintext and null hash when key is absent', async () => {
    delete process.env.FIELD_ENCRYPTION_KEY
    mockCreate.mockResolvedValue(makeDbEmployee({ idNumber: 'ID-000', idNumberHash: null }))

    await createEmployee(companyCtx, {
      companyId: 'company-1',
      firstName: 'Jane',
      lastName: 'Smith',
      idNumber: 'ID-000',
    })

    const [[{ data }]] = mockCreate.mock.calls as any
    expect(data.idNumber).toBe('ID-000')
    expect(data.idNumberHash).toBeNull()
  })

  it('stores null for both idNumber and idNumberHash when idNumber is null', async () => {
    process.env.FIELD_ENCRYPTION_KEY = TEST_KEY_B64
    mockCreate.mockResolvedValue(makeDbEmployee())

    await createEmployee(companyCtx, {
      companyId: 'company-1',
      firstName: 'Jane',
      lastName: 'Smith',
    })

    const [[{ data }]] = mockCreate.mock.calls as any
    expect(data.idNumber).toBeNull()
    expect(data.idNumberHash).toBeNull()
  })
})

describe('updateEmployee — re-encryption on write', () => {
  const savedKey = process.env.FIELD_ENCRYPTION_KEY

  beforeEach(() => {
    mockFindFirst.mockResolvedValue(makeDbEmployee())
  })

  afterEach(() => {
    if (savedKey === undefined) delete process.env.FIELD_ENCRYPTION_KEY
    else process.env.FIELD_ENCRYPTION_KEY = savedKey
    vi.clearAllMocks()
  })

  it('re-encrypts idNumber and updates idNumberHash when key is present', async () => {
    process.env.FIELD_ENCRYPTION_KEY = TEST_KEY_B64
    const newId = 'NEW-456'
    mockUpdate.mockResolvedValue(makeDbEmployee({ idNumber: encryptField(newId, TEST_KEY), idNumberHash: hashForSearch(newId, TEST_KEY) }))

    await updateEmployee(companyCtx, 'emp-1', { idNumber: newId })

    const { data } = mockUpdate.mock.calls[0][0] as any
    expect(data.idNumber).not.toBe(newId)
    expect(data.idNumber.split(':').length).toBe(3)
    expect(data.idNumberHash).toBe(hashForSearch(newId, TEST_KEY))
  })

  it('nulls both idNumber and idNumberHash when idNumber is explicitly set to null', async () => {
    process.env.FIELD_ENCRYPTION_KEY = TEST_KEY_B64
    mockUpdate.mockResolvedValue(makeDbEmployee())

    await updateEmployee(companyCtx, 'emp-1', { idNumber: null })

    const { data } = mockUpdate.mock.calls[0][0] as any
    expect(data.idNumber).toBeNull()
    expect(data.idNumberHash).toBeNull()
  })

  it('returns null when employee does not belong to company', async () => {
    process.env.FIELD_ENCRYPTION_KEY = TEST_KEY_B64
    mockFindFirst.mockResolvedValue(null)

    const result = await updateEmployee(companyCtx, 'emp-other', { idNumber: 'X' })
    expect(result).toBeNull()
    expect(mockUpdate).not.toHaveBeenCalled()
  })
})
