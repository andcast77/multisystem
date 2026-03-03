import { prisma, Prisma } from '../db/index.js'
import type { CompanyContext } from '../core/auth-context.js'

type EmployeeRow = {
  id: string
  companyId: string
  departmentId: string | null
  positionId: string | null
  userId: string | null
  idNumber: string | null
  firstName: string
  lastName: string
  birthDate: Date | null
  gender: string | null
  dateJoined: Date
  status: string
  createdAt: Date
  updatedAt: Date
}

export async function listEmployees(
  ctx: CompanyContext,
  query: { page?: string; limit?: string; search?: string; status?: string; departmentId?: string }
): Promise<{
  employees: EmployeeRow[]
  total: number
  page: number
  limit: number
}> {
  const page = Math.max(1, parseInt(query.page ?? '1', 10) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? '10', 10) || 10))
  const skip = (page - 1) * limit

  const where: Prisma.EmployeeWhereInput = {
    companyId: ctx.companyId,
    isDeleted: false,
  }
  if (query.search) {
    where.OR = [
      { firstName: { contains: query.search, mode: 'insensitive' } },
      { lastName: { contains: query.search, mode: 'insensitive' } },
      { idNumber: { contains: query.search, mode: 'insensitive' } },
    ]
  }
  if (query.status) where.status = query.status as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  if (query.departmentId) where.departmentId = query.departmentId

  const [total, employees] = await Promise.all([
    prisma.employee.count({ where }),
    prisma.employee.findMany({
      where,
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      skip,
      take: limit,
    }),
  ])

  return {
    employees: employees.map((e) => ({
      id: e.id,
      companyId: e.companyId,
      departmentId: e.departmentId,
      positionId: e.positionId,
      userId: e.userId,
      idNumber: e.idNumber,
      firstName: e.firstName,
      lastName: e.lastName,
      birthDate: e.birthDate,
      gender: e.gender,
      dateJoined: e.dateJoined,
      status: e.status,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    })) as EmployeeRow[],
    total,
    page,
    limit,
  }
}

export async function getEmployeeById(
  ctx: CompanyContext,
  id: string
): Promise<EmployeeRow | null> {
  const e = await prisma.employee.findFirst({
    where: { id, companyId: ctx.companyId, isDeleted: false },
  })
  if (!e) return null
  return {
    id: e.id,
    companyId: e.companyId,
    departmentId: e.departmentId,
    positionId: e.positionId,
    userId: e.userId,
    idNumber: e.idNumber,
    firstName: e.firstName,
    lastName: e.lastName,
    birthDate: e.birthDate,
    gender: e.gender,
    dateJoined: e.dateJoined,
    status: e.status,
    createdAt: e.createdAt,
    updatedAt: e.updatedAt,
  } as EmployeeRow
}
