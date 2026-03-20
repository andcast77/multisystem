import { Prisma, prisma } from '../db/index.js'
import type { CompanyContext } from '../core/auth-context.js'
import { parsePagination } from '../common/database/index.js'

type WorkOrderRow = {
  id: string
  companyId: string
  assetId: string | null
  createdByUserId: string
  assignedEmployeeId: string | null
  title: string
  description: string | null
  status: string
  priority: string
  requestedAt: Date
  dueAt: Date | null
  completedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

type ListQuery = {
  page?: string
  limit?: string
  search?: string
  status?: string
  priority?: string
  assignedEmployeeId?: string
  assetId?: string
}

const statusEnum = ['OPEN', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'] as const
const priorityEnum = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const

function toWorkOrderRow(w: {
  id: string
  companyId: string
  assetId: string | null
  createdByUserId: string
  assignedEmployeeId: string | null
  title: string
  description: string | null
  status: string
  priority: string
  requestedAt: Date
  dueAt: Date | null
  completedAt: Date | null
  createdAt: Date
  updatedAt: Date
}): WorkOrderRow {
  return { ...w }
}

export async function listWorkOrders(
  ctx: CompanyContext,
  query: ListQuery
): Promise<{
  workOrders: WorkOrderRow[]
  page: number
  limit: number
  total: number
  totalPages: number
}> {
  const { page, limit, skip } = parsePagination(query)

  const where: Prisma.WorkOrderWhereInput = { companyId: ctx.companyId }
  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: 'insensitive' } },
      { description: { contains: query.search, mode: 'insensitive' } },
    ]
  }
  if (query.status && statusEnum.includes(query.status as (typeof statusEnum)[number])) {
    where.status = query.status as (typeof statusEnum)[number]
  }
  if (query.priority && priorityEnum.includes(query.priority as (typeof priorityEnum)[number])) {
    where.priority = query.priority as (typeof priorityEnum)[number]
  }
  if (query.assignedEmployeeId) where.assignedEmployeeId = query.assignedEmployeeId
  if (query.assetId) where.assetId = query.assetId

  const [total, workOrders] = await Promise.all([
    prisma.workOrder.count({ where }),
    prisma.workOrder.findMany({
      where,
      orderBy: { requestedAt: 'desc' },
      skip,
      take: limit,
    }),
  ])

  return {
    workOrders: workOrders.map(toWorkOrderRow),
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  }
}

export async function getWorkOrderById(
  ctx: CompanyContext,
  id: string
): Promise<WorkOrderRow | null> {
  const w = await prisma.workOrder.findFirst({
    where: { id, companyId: ctx.companyId },
  })
  return w ? toWorkOrderRow(w) : null
}

type CreateBody = {
  title: string
  description?: string | null
  status?: string
  priority?: string
  assetId?: string | null
  assignedEmployeeId?: string | null
  requestedAt?: string | null
  dueAt?: string | null
  completedAt?: string | null
}

export async function createWorkOrder(
  ctx: CompanyContext,
  body: CreateBody
): Promise<WorkOrderRow> {
  const w = await prisma.workOrder.create({
    data: {
      companyId: ctx.companyId,
      createdByUserId: ctx.userId,
      title: body.title,
      description: body.description ?? null,
      status: (statusEnum.includes((body.status as (typeof statusEnum)[number]) ?? 'OPEN') ? body.status : 'OPEN') as (typeof statusEnum)[number],
      priority: (priorityEnum.includes((body.priority as (typeof priorityEnum)[number]) ?? 'MEDIUM') ? body.priority : 'MEDIUM') as (typeof priorityEnum)[number],
      assetId: body.assetId ?? null,
      assignedEmployeeId: body.assignedEmployeeId ?? null,
      requestedAt: body.requestedAt ? new Date(body.requestedAt) : new Date(),
      dueAt: body.dueAt ? new Date(body.dueAt) : null,
      completedAt: body.completedAt ? new Date(body.completedAt) : null,
    },
  })
  return toWorkOrderRow(w)
}

type UpdateBody = {
  title?: string
  description?: string | null
  status?: string
  priority?: string
  assetId?: string | null
  assignedEmployeeId?: string | null
  requestedAt?: string | null
  dueAt?: string | null
  completedAt?: string | null
}

export async function updateWorkOrder(
  ctx: CompanyContext,
  id: string,
  body: UpdateBody
): Promise<WorkOrderRow | null> {
  const existing = await prisma.workOrder.findFirst({
    where: { id, companyId: ctx.companyId },
    select: { id: true },
  })
  if (!existing) return null

  const data: Prisma.WorkOrderUpdateInput = {}
  if (body.title !== undefined) data.title = body.title
  if (body.description !== undefined) data.description = body.description
  if (body.status !== undefined && statusEnum.includes(body.status as (typeof statusEnum)[number])) data.status = body.status as (typeof statusEnum)[number]
  if (body.priority !== undefined && priorityEnum.includes(body.priority as (typeof priorityEnum)[number])) data.priority = body.priority as (typeof priorityEnum)[number]
  if (body.assetId !== undefined) {
    data.asset = body.assetId ? { connect: { id: body.assetId } } : { disconnect: true }
  }
  if (body.assignedEmployeeId !== undefined) {
    data.assignedEmployee = body.assignedEmployeeId
      ? { connect: { id: body.assignedEmployeeId } }
      : { disconnect: true }
  }
  if (body.requestedAt !== undefined) data.requestedAt = body.requestedAt ? new Date(body.requestedAt) : new Date()
  if (body.dueAt !== undefined) data.dueAt = body.dueAt ? new Date(body.dueAt) : { set: null }
  if (body.completedAt !== undefined) data.completedAt = body.completedAt ? new Date(body.completedAt) : { set: null }
  else if (body.status === 'COMPLETED') data.completedAt = new Date()

  if (Object.keys(data).length === 0) return getWorkOrderById(ctx, id)

  const updated = await prisma.workOrder.updateMany({
    where: { id, companyId: ctx.companyId },
    data,
  })
  if (updated.count === 0) return null
  const w = await prisma.workOrder.findFirst({
    where: { id, companyId: ctx.companyId },
  })
  return w ? toWorkOrderRow(w) : null
}
