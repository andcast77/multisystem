import { prisma, Prisma } from '../db/index.js'
import type { CompanyContext } from '../core/auth-context.js'
import { getCompanyModules } from '../core/modules.js'
import * as employeesService from './employees.service.js'
import type {
  WorkifyMeUser,
  WorkifyMeCompany,
  WorkifyMeRole,
} from '../dto/workify.dto.js'
import * as workifyHelper from '../helpers/workify.helper.js'

// --- Employees (delegate to employees.service) ---

export async function listEmployees(
  ctx: CompanyContext,
  query: { page?: string; limit?: string; search?: string; status?: string; departmentId?: string }
) {
  return employeesService.listEmployees(ctx, query)
}

export async function getEmployeeById(ctx: CompanyContext, id: string) {
  return employeesService.getEmployeeById(ctx, id)
}

// --- Me ---

export async function getMe(ctx: CompanyContext): Promise<{ user: WorkifyMeUser } | { error: string; code: number }> {
  const user = await prisma.user.findUnique({
    where: { id: ctx.userId },
    select: { id: true, email: true, firstName: true, lastName: true, isActive: true },
  })
  if (!user || !user.isActive) return { error: 'Usuario no encontrado o inactivo', code: 401 }

  let resolvedCompanyId: string | null = ctx.companyId
  const roles: WorkifyMeRole[] = resolvedCompanyId
    ? [{ role: { name: ctx.membershipRole || 'USER' }, companyId: resolvedCompanyId }]
    : []

  let company: WorkifyMeCompany | null = null
  if (resolvedCompanyId) {
    const companyRow = await prisma.company.findFirst({
      where: { id: resolvedCompanyId, isActive: true },
      select: { id: true, name: true },
    })
    if (companyRow) {
      const modules = await getCompanyModules(companyRow.id)
      company = workifyHelper.toWorkifyMeCompany({
        id: companyRow.id,
        name: companyRow.name,
        workifyEnabled: modules?.workify ?? false,
        shopflowEnabled: modules?.shopflow ?? false,
        technicalServicesEnabled: modules?.techservices ?? false,
      })
    }
  }

  const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email
  const safeUser = workifyHelper.toWorkifyMeUser({
    id: user.id,
    email: user.email,
    name,
    companyId: resolvedCompanyId ?? undefined,
    membershipRole: ctx.membershipRole ?? undefined,
    isSuperuser: ctx.isSuperuser ?? false,
    company: company ?? undefined,
    roles,
  })
  return { user: safeUser }
}

// --- Positions ---

export async function listPositions(ctx: CompanyContext) {
  return prisma.position.findMany({
    where: { department: { companyId: ctx.companyId } },
    orderBy: { name: 'asc' },
  })
}

export async function getPositionById(ctx: CompanyContext, id: string) {
  return prisma.position.findFirst({
    where: { id, department: { companyId: ctx.companyId } },
  })
}

// --- Roles ---

export async function listRoles(ctx: CompanyContext) {
  return prisma.role.findMany({
    where: { companyId: ctx.companyId },
    orderBy: { name: 'asc' },
  })
}

export async function getRoleById(ctx: CompanyContext, id: string) {
  return prisma.role.findFirst({
    where: { id, companyId: ctx.companyId },
  })
}

// --- Holidays ---

export async function listHolidays(ctx: CompanyContext) {
  return prisma.holiday.findMany({
    where: { companyId: ctx.companyId },
    orderBy: { date: 'asc' },
  })
}

export async function getHolidayById(ctx: CompanyContext, id: string) {
  return prisma.holiday.findFirst({
    where: { id, companyId: ctx.companyId },
  })
}

// --- Work shifts ---

export async function listWorkShifts(ctx: CompanyContext) {
  return prisma.workShift.findMany({
    where: { companyId: ctx.companyId },
    orderBy: { name: 'asc' },
  })
}

// --- Dashboard ---

export async function getDashboardStats(ctx: CompanyContext) {
  const totalEmployees = await prisma.employee.count({
    where: { companyId: ctx.companyId, isDeleted: false },
  })
  return { totalEmployees }
}

// --- Time entries ---

export async function listTimeEntries(
  ctx: CompanyContext,
  query: { employeeId?: string; start?: string; end?: string }
) {
  const where: Prisma.TimeEntryWhereInput = { companyId: ctx.companyId }
  if (query.employeeId) where.employeeId = query.employeeId
  if (query.start && query.end) where.date = { gte: new Date(query.start), lte: new Date(query.end) }
  else if (query.start) where.date = { gte: new Date(query.start) }
  else if (query.end) where.date = { lte: new Date(query.end) }
  return prisma.timeEntry.findMany({
    where,
    orderBy: [{ date: 'desc' }, { clockIn: 'desc' }],
  })
}

// --- Employee attendance (time entries for one employee) ---

export async function getEmployeeAttendance(
  ctx: CompanyContext,
  employeeId: string,
  month?: string
) {
  const where: Prisma.TimeEntryWhereInput = {
    employeeId,
    employee: { companyId: ctx.companyId },
  }
  if (month) {
    const start = new Date(month)
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0)
    where.date = { gte: start, lte: end }
  }
  return prisma.timeEntry.findMany({
    where,
    orderBy: { date: 'desc' },
    select: { id: true, date: true, clockIn: true, clockOut: true, breakStart: true, breakEnd: true, notes: true },
  })
}

// --- Attendance stats ---

export async function getAttendanceStats(ctx: CompanyContext, date?: string) {
  const targetDate = date ? new Date(date) : new Date()
  const dayStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate())
  const dayEnd = new Date(dayStart)
  dayEnd.setDate(dayEnd.getDate() + 1)
  const present = await prisma.timeEntry.groupBy({
    by: ['employeeId'],
    where: {
      companyId: ctx.companyId,
      date: { gte: dayStart, lt: dayEnd },
    },
  })
  return { present: present.length }
}

// --- Special assignments ---

export async function listSpecialAssignments(ctx: CompanyContext) {
  return prisma.specialDayAssignment.findMany({
    where: { employee: { companyId: ctx.companyId } },
    orderBy: { date: 'desc' },
  })
}
