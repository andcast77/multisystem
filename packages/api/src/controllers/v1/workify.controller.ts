import type { FastifyRequest, FastifyReply } from 'fastify'
import type { FastifyInstance } from 'fastify'
import { requireAuth } from '../../core/auth.js'
import { requireWorkifyContext, requireRole } from '../../core/auth-context.js'
import { contextFromRequest } from '../../core/auth-context.js'
import { requireModuleAccess } from '../../core/modules.js'
import { sendNotFound, sendServerError } from '../../core/errors.js'
import { validateBody } from '../../core/validate.js'
import { createEmployeeBodySchema, updateEmployeeBodySchema } from '../../dto/workify.dto.js'
import * as workifyService from '../../services/workify.service.js'
import * as workifyHelper from '../../helpers/workify.helper.js'

function getCtx(request: FastifyRequest) {
  return contextFromRequest(request)
}

export async function getMe(request: FastifyRequest, reply: FastifyReply) {
  try {
    const ctx = getCtx(request)
    const result = await workifyService.getMe(ctx)
    if ('error' in result) {
      reply.code(result.code)
      return { success: false, error: result.error }
    }
    return { success: true, user: result.user }
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al obtener usuario')
  }
}

export async function listEmployees(
  request: FastifyRequest<{ Querystring: { page?: string; limit?: string; search?: string; status?: string; departmentId?: string } }>,
  reply: FastifyReply
) {
  try {
    const ctx = getCtx(request)
    const result = await workifyService.listEmployees(ctx, request.query)
    const employees = result.employees.map((r) => workifyHelper.toWorkifyEmployee(r))
    return {
      success: true,
      employees,
      total: result.total,
      page: result.page,
      limit: result.limit,
    }
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al listar empleados')
  }
}

export async function getEmployeeById(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const ctx = getCtx(request)
    const employee = await workifyService.getEmployeeById(ctx, request.params.id)
    if (!employee) {
      return sendNotFound(reply, 'Empleado no encontrado')
    }
    return { success: true, employee: workifyHelper.toWorkifyEmployee(employee) }
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al obtener empleado')
  }
}

export async function getEmployeeAttendance(
  request: FastifyRequest<{ Params: { id: string }; Querystring: { month?: string } }>,
  reply: FastifyReply
) {
  try {
    const ctx = getCtx(request)
    const { id } = request.params
    const { month } = request.query
    const rows = await workifyService.getEmployeeAttendance(ctx, id, month)
    const attendance = rows.map((r: Record<string, unknown>) => workifyHelper.toWorkifyAttendanceEntry(r))
    return { success: true, attendance }
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al obtener asistencia')
  }
}

export async function listPositions(request: FastifyRequest, reply: FastifyReply) {
  try {
    const ctx = getCtx(request)
    const rows = await workifyService.listPositions(ctx)
    return { success: true, positions: rows.map((r: Record<string, unknown>) => workifyHelper.toWorkifyPosition(r)) }
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al listar posiciones')
  }
}

export async function getPositionById(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const ctx = getCtx(request)
    const position = await workifyService.getPositionById(ctx, request.params.id)
    if (!position) {
      return sendNotFound(reply, 'Posición no encontrada')
    }
    return { success: true, position: workifyHelper.toWorkifyPosition(position) }
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al obtener posición')
  }
}

export async function listRoles(request: FastifyRequest, reply: FastifyReply) {
  try {
    const ctx = getCtx(request)
    const rows = await workifyService.listRoles(ctx)
    return { success: true, roles: rows.map((r: Record<string, unknown>) => workifyHelper.toWorkifyRole(r)) }
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al listar roles')
  }
}

export async function getRoleById(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const ctx = getCtx(request)
    const role = await workifyService.getRoleById(ctx, request.params.id)
    if (!role) {
      return sendNotFound(reply, 'Rol no encontrado')
    }
    return { success: true, role: workifyHelper.toWorkifyRole(role) }
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al obtener rol')
  }
}

export async function listHolidays(request: FastifyRequest, reply: FastifyReply) {
  try {
    const ctx = getCtx(request)
    const rows = await workifyService.listHolidays(ctx)
    return { success: true, holidays: rows.map((r: Record<string, unknown>) => workifyHelper.toWorkifyHoliday(r)) }
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al listar festivos')
  }
}

export async function getHolidayById(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const ctx = getCtx(request)
    const holiday = await workifyService.getHolidayById(ctx, request.params.id)
    if (!holiday) {
      return sendNotFound(reply, 'Festivo no encontrado')
    }
    return { success: true, holiday: workifyHelper.toWorkifyHoliday(holiday) }
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al obtener festivo')
  }
}

export async function listWorkShifts(request: FastifyRequest, reply: FastifyReply) {
  try {
    const ctx = getCtx(request)
    const rows = await workifyService.listWorkShifts(ctx)
    return { success: true, workShifts: rows.map((r: Record<string, unknown>) => workifyHelper.toWorkifyWorkShift(r)) }
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al listar turnos')
  }
}

export async function getDashboardStats(request: FastifyRequest, reply: FastifyReply) {
  try {
    const ctx = getCtx(request)
    const stats = await workifyService.getDashboardStats(ctx)
    return { success: true, ...stats }
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al obtener estadísticas')
  }
}

export async function listTimeEntries(
  request: FastifyRequest<{ Querystring: { employeeId?: string; start?: string; end?: string } }>,
  reply: FastifyReply
) {
  try {
    const ctx = getCtx(request)
    const rows = await workifyService.listTimeEntries(ctx, request.query)
    return { success: true, timeEntries: rows.map((r: Record<string, unknown>) => workifyHelper.toWorkifyTimeEntry(r)) }
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al listar registros')
  }
}

export async function getAttendanceStats(
  request: FastifyRequest<{ Querystring: { date?: string } }>,
  reply: FastifyReply
) {
  try {
    const ctx = getCtx(request)
    const { date } = request.query
    const stats = await workifyService.getAttendanceStats(ctx, date)
    return { success: true, ...stats }
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al obtener asistencia')
  }
}

export async function createEmployee(request: FastifyRequest, reply: FastifyReply) {
  try {
    const ctx = getCtx(request)
    const body = validateBody(createEmployeeBodySchema, request.body)
    const employee = await workifyService.createEmployee(ctx, {
      companyId: ctx.companyId,
      firstName: body.firstName,
      lastName: body.lastName,
      idNumber: body.idNumber ?? null,
      birthDate: body.birthDate ? new Date(body.birthDate) : null,
      gender: body.gender ?? null,
      departmentId: body.departmentId ?? null,
      positionId: body.positionId ?? null,
      userId: body.userId ?? null,
      dateJoined: body.dateJoined ? new Date(body.dateJoined) : undefined,
      status: body.status,
      customSalaryAmount: body.customSalaryAmount ?? null,
      customSalaryType: body.customSalaryType ?? null,
      customOvertimeEligible: body.customOvertimeEligible,
    })
    reply.code(201)
    return { success: true, employee: workifyHelper.toWorkifyEmployee(employee) }
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al crear empleado')
  }
}

export async function updateEmployee(
  request: FastifyRequest<{ Params: { id: string }; Body: unknown }>,
  reply: FastifyReply
) {
  try {
    const ctx = getCtx(request)
    const body = validateBody(updateEmployeeBodySchema, request.body)
    const employee = await workifyService.updateEmployee(ctx, request.params.id, {
      firstName: body.firstName,
      lastName: body.lastName,
      idNumber: body.idNumber,
      birthDate: body.birthDate !== undefined ? (body.birthDate ? new Date(body.birthDate) : null) : undefined,
      gender: body.gender,
      departmentId: body.departmentId,
      positionId: body.positionId,
      userId: body.userId,
      dateJoined: body.dateJoined ? new Date(body.dateJoined) : undefined,
      status: body.status,
      customSalaryAmount: body.customSalaryAmount,
      customSalaryType: body.customSalaryType,
      customOvertimeEligible: body.customOvertimeEligible,
    })
    if (!employee) {
      return sendNotFound(reply, 'Empleado no encontrado')
    }
    return { success: true, employee: workifyHelper.toWorkifyEmployee(employee) }
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al actualizar empleado')
  }
}

export async function listSpecialAssignments(request: FastifyRequest, reply: FastifyReply) {
  try {
    const ctx = getCtx(request)
    const rows = await workifyService.listSpecialAssignments(ctx)
    return {
      success: true,
      specialAssignments: rows.map((r: Record<string, unknown>) => workifyHelper.toWorkifySpecialAssignment(r)),
    }
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al listar asignaciones')
  }
}

const preWorkify = [requireAuth, requireWorkifyContext, requireModuleAccess('workify')]
const preWorkifyWrite = [...preWorkify, requireRole(['owner', 'admin'])]

/** Wraps a handler so Fastify's generic request is cast to the handler's expected type. */
function handle<T extends (req: any, rep: any) => any>(
  handler: T
): (req: FastifyRequest, rep: FastifyReply) => ReturnType<T> {
  return (req, rep) => handler(req as Parameters<T>[0], rep as Parameters<T>[1])
}

export async function registerRoutes(fastify: FastifyInstance) {
  fastify.get('/v1/workify/me', { preHandler: preWorkify }, handle(getMe))
  fastify.get('/v1/workify/employees', { preHandler: preWorkify }, handle(listEmployees))
  fastify.post('/v1/workify/employees', { preHandler: preWorkifyWrite }, handle(createEmployee))
  fastify.get<{ Params: { id: string } }>('/v1/workify/employees/:id', { preHandler: preWorkify }, handle(getEmployeeById))
  fastify.patch<{ Params: { id: string }; Body: unknown }>('/v1/workify/employees/:id', { preHandler: preWorkifyWrite }, handle(updateEmployee))
  fastify.get<{ Params: { id: string }; Querystring: { month?: string } }>('/v1/workify/employees/:id/attendance', { preHandler: preWorkify }, handle(getEmployeeAttendance))
  fastify.get('/v1/workify/positions', { preHandler: preWorkify }, handle(listPositions))
  fastify.get<{ Params: { id: string } }>('/v1/workify/positions/:id', { preHandler: preWorkify }, handle(getPositionById))
  fastify.get('/v1/workify/roles', { preHandler: preWorkify }, handle(listRoles))
  fastify.get<{ Params: { id: string } }>('/v1/workify/roles/:id', { preHandler: preWorkify }, handle(getRoleById))
  fastify.get('/v1/workify/holidays', { preHandler: preWorkify }, handle(listHolidays))
  fastify.get<{ Params: { id: string } }>('/v1/workify/holidays/:id', { preHandler: preWorkify }, handle(getHolidayById))
  fastify.get('/v1/workify/work-shifts', { preHandler: preWorkify }, handle(listWorkShifts))
  fastify.get('/v1/workify/time-entries', { preHandler: preWorkify }, handle(listTimeEntries))
  fastify.get('/v1/workify/dashboard/stats', { preHandler: preWorkify }, handle(getDashboardStats))
  fastify.get('/v1/workify/attendance/stats', { preHandler: preWorkify }, handle(getAttendanceStats))
  fastify.get('/v1/workify/employees/special-assignments', { preHandler: preWorkify }, handle(listSpecialAssignments))
}
