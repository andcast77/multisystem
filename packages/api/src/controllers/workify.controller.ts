import type { FastifyRequest, FastifyReply } from 'fastify'
import type { FastifyInstance } from 'fastify'
import { requireAuth } from '../core/auth.js'
import { requireWorkifyContext } from '../core/auth-context.js'
import { contextFromRequest } from '../core/auth-context.js'
import { sendNotFound, sendServerError } from '../core/errors.js'
import * as workifyService from '../services/workify.service.js'
import * as workifyHelper from '../helpers/workify.helper.js'

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
    const attendance = rows.map((r) => workifyHelper.toWorkifyAttendanceEntry(r))
    return { success: true, attendance }
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al obtener asistencia')
  }
}

export async function listPositions(request: FastifyRequest, reply: FastifyReply) {
  try {
    const ctx = getCtx(request)
    const rows = await workifyService.listPositions(ctx)
    return { success: true, positions: rows.map((r) => workifyHelper.toWorkifyPosition(r)) }
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
    return { success: true, roles: rows.map((r) => workifyHelper.toWorkifyRole(r)) }
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
    return { success: true, holidays: rows.map((r) => workifyHelper.toWorkifyHoliday(r)) }
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
    return { success: true, workShifts: rows.map((r) => workifyHelper.toWorkifyWorkShift(r)) }
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
    return { success: true, timeEntries: rows.map((r) => workifyHelper.toWorkifyTimeEntry(r)) }
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

export async function listSpecialAssignments(request: FastifyRequest, reply: FastifyReply) {
  try {
    const ctx = getCtx(request)
    const rows = await workifyService.listSpecialAssignments(ctx)
    return {
      success: true,
      specialAssignments: rows.map((r) => workifyHelper.toWorkifySpecialAssignment(r)),
    }
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al listar asignaciones')
  }
}

const preWorkify = [requireAuth, requireWorkifyContext]

export async function registerRoutes(fastify: FastifyInstance) {
  type Req = FastifyRequest
  type Rep = FastifyReply
  fastify.get('/api/workify/me', { preHandler: preWorkify }, (req: Req, rep: Rep) => getMe(req, rep))
  fastify.get('/api/workify/employees', { preHandler: preWorkify }, (req: Req, rep: Rep) => listEmployees(req, rep))
  fastify.get<{ Params: { id: string } }>('/api/workify/employees/:id', { preHandler: preWorkify }, (req: Req, rep: Rep) => getEmployeeById(req, rep))
  fastify.get<{ Params: { id: string }; Querystring: { month?: string } }>('/api/workify/employees/:id/attendance', { preHandler: preWorkify }, (req: Req, rep: Rep) => getEmployeeAttendance(req, rep))
  fastify.get('/api/workify/positions', { preHandler: preWorkify }, (req: Req, rep: Rep) => listPositions(req, rep))
  fastify.get<{ Params: { id: string } }>('/api/workify/positions/:id', { preHandler: preWorkify }, (req: Req, rep: Rep) => getPositionById(req, rep))
  fastify.get('/api/workify/roles', { preHandler: preWorkify }, (req: Req, rep: Rep) => listRoles(req, rep))
  fastify.get<{ Params: { id: string } }>('/api/workify/roles/:id', { preHandler: preWorkify }, (req: Req, rep: Rep) => getRoleById(req, rep))
  fastify.get('/api/workify/holidays', { preHandler: preWorkify }, (req: Req, rep: Rep) => listHolidays(req, rep))
  fastify.get<{ Params: { id: string } }>('/api/workify/holidays/:id', { preHandler: preWorkify }, (req: Req, rep: Rep) => getHolidayById(req, rep))
  fastify.get('/api/workify/work-shifts', { preHandler: preWorkify }, (req: Req, rep: Rep) => listWorkShifts(req, rep))
  fastify.get('/api/workify/time-entries', { preHandler: preWorkify }, (req: Req, rep: Rep) => listTimeEntries(req, rep))
  fastify.get('/api/workify/dashboard/stats', { preHandler: preWorkify }, (req: Req, rep: Rep) => getDashboardStats(req, rep))
  fastify.get('/api/workify/attendance/stats', { preHandler: preWorkify }, (req: Req, rep: Rep) => getAttendanceStats(req, rep))
  fastify.get('/api/workify/employees/special-assignments', { preHandler: preWorkify }, (req: Req, rep: Rep) => listSpecialAssignments(req, rep))
}
