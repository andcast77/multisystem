import type { FastifyRequest, FastifyReply } from 'fastify'
import type { FastifyInstance } from 'fastify'
import { requireAuth } from '../core/auth.js'
import { contextFromRequest, requireWorkifyContext } from '../core/auth-context.js'
import { sendBadRequest, sendNotFound, sendServerError } from '../core/errors.js'
import { validateOr400 } from '../core/validate.js'
import {
  workOrderCreateBodySchema,
  workOrderUpdateBodySchema,
  assetCreateBodySchema,
  assetUpdateBodySchema,
  partCreateBodySchema,
  partUpdateBodySchema,
  visitCreateBodySchema,
  visitUpdateBodySchema,
} from '../dto/techservices.dto.js'
import * as techservicesService from '../services/techservices.service.js'

// ----- Work orders -----

export async function listWorkOrders(
  request: FastifyRequest<{ Querystring: { page?: string; limit?: string; search?: string; status?: string; priority?: string; assignedEmployeeId?: string; assetId?: string } }>,
  reply: FastifyReply
) {
  try {
    const ctx = contextFromRequest(request)
    const result = await techservicesService.listWorkOrders(ctx, request.query)
    return {
      success: true,
      data: result.workOrders,
      pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages },
    }
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al listar ordenes')
  }
}

export async function getWorkOrderById(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const ctx = contextFromRequest(request)
    const data = await techservicesService.getWorkOrderById(ctx, request.params.id)
    if (!data) return sendNotFound(reply, 'Orden no encontrada')
    return { success: true, data }
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al obtener orden')
  }
}

export async function createWorkOrder(
  request: FastifyRequest<{ Body: unknown }>,
  reply: FastifyReply
) {
  const body = validateOr400(reply, workOrderCreateBodySchema, request.body)
  if (body === null) return
  try {
    const ctx = contextFromRequest(request)
    const result = await techservicesService.createWorkOrder(ctx, body)
    if (result && 'error' in result) {
      reply.code(400)
      return { success: false, error: result.error }
    }
    return { success: true, data: result!.data }
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al crear orden')
  }
}

export async function updateWorkOrder(
  request: FastifyRequest<{ Params: { id: string }; Body: unknown }>,
  reply: FastifyReply
) {
  const body = validateOr400(reply, workOrderUpdateBodySchema, request.body ?? {})
  if (body === null) return
  try {
    const ctx = contextFromRequest(request)
    const result = await techservicesService.updateWorkOrder(ctx, request.params.id, body)
    if (!result) return sendNotFound(reply, 'Orden no encontrada')
    return { success: true, data: result.data }
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al actualizar orden')
  }
}

// ----- Assets -----

export async function listAssets(
  request: FastifyRequest<{ Querystring: { search?: string; active?: string } }>,
  reply: FastifyReply
) {
  try {
    const ctx = contextFromRequest(request)
    const data = await techservicesService.listAssets(ctx, request.query)
    return { success: true, data }
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al listar activos')
  }
}

export async function getAssetById(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const ctx = contextFromRequest(request)
    const data = await techservicesService.getAssetById(ctx, request.params.id)
    if (!data) return sendNotFound(reply, 'Activo no encontrado')
    return { success: true, data }
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al obtener activo')
  }
}

export async function createAsset(
  request: FastifyRequest<{ Body: unknown }>,
  reply: FastifyReply
) {
  const body = validateOr400(reply, assetCreateBodySchema, request.body)
  if (body === null) return
  try {
    const ctx = contextFromRequest(request)
    const data = await techservicesService.createAsset(ctx, body)
    return { success: true, data }
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al crear activo')
  }
}

export async function updateAsset(
  request: FastifyRequest<{ Params: { id: string }; Body: unknown }>,
  reply: FastifyReply
) {
  const body = validateOr400(reply, assetUpdateBodySchema, request.body ?? {})
  if (body === null) return
  try {
    const ctx = contextFromRequest(request)
    const data = await techservicesService.updateAsset(ctx, request.params.id, body)
    if (!data) return sendNotFound(reply, 'Activo no encontrado')
    return { success: true, data }
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al actualizar activo')
  }
}

export async function deleteAsset(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const ctx = contextFromRequest(request)
    const deleted = await techservicesService.deleteAsset(ctx, request.params.id)
    if (!deleted) return sendNotFound(reply, 'Activo no encontrado')
    return { success: true }
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al eliminar activo')
  }
}

// ----- Parts -----

export async function listParts(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const ctx = contextFromRequest(request)
    const data = await techservicesService.listParts(ctx, request.params.id)
    return { success: true, data }
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al listar partes')
  }
}

export async function createPart(
  request: FastifyRequest<{ Params: { id: string }; Body: unknown }>,
  reply: FastifyReply
) {
  const body = validateOr400(reply, partCreateBodySchema, request.body)
  if (body === null) return
  try {
    const ctx = contextFromRequest(request)
    const result = await techservicesService.createPart(ctx, request.params.id, body)
    if (result && 'notFound' in result) return sendNotFound(reply, 'Orden no encontrada')
    return { success: true, data: result!.data }
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al agregar parte')
  }
}

export async function updatePart(
  request: FastifyRequest<{ Params: { id: string }; Body: unknown }>,
  reply: FastifyReply
) {
  const body = validateOr400(reply, partUpdateBodySchema, request.body ?? {})
  if (body === null) return
  try {
    const ctx = contextFromRequest(request)
    const result = await techservicesService.updatePart(ctx, request.params.id, body)
    if (!result) return sendNotFound(reply, 'Parte no encontrada')
    return { success: true }
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al actualizar parte')
  }
}

export async function deletePart(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const ctx = contextFromRequest(request)
    const deleted = await techservicesService.deletePart(ctx, request.params.id)
    if (!deleted) return sendNotFound(reply, 'Parte no encontrada')
    return { success: true }
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al eliminar parte')
  }
}

// ----- Visits -----

export async function listVisits(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const ctx = contextFromRequest(request)
    const data = await techservicesService.listVisits(ctx, request.params.id)
    return { success: true, data }
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al listar visitas')
  }
}

export async function createVisit(
  request: FastifyRequest<{ Params: { id: string }; Body: unknown }>,
  reply: FastifyReply
) {
  const body = validateOr400(reply, visitCreateBodySchema, request.body)
  if (body === null) return
  try {
    const ctx = contextFromRequest(request)
    const result = await techservicesService.createVisit(ctx, request.params.id, body)
    if (result && 'badRequest' in result) return sendBadRequest(reply, result.badRequest)
    if (result && 'notFound' in result) return sendNotFound(reply, 'Orden no encontrada')
    return { success: true, data: result!.data }
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al crear visita')
  }
}

export async function updateVisit(
  request: FastifyRequest<{ Params: { id: string }; Body: unknown }>,
  reply: FastifyReply
) {
  const body = validateOr400(reply, visitUpdateBodySchema, request.body ?? {})
  if (body === null) return
  try {
    const ctx = contextFromRequest(request)
    const result = await techservicesService.updateVisit(ctx, request.params.id, body)
    if (result && 'badRequest' in result) return sendBadRequest(reply, result.badRequest)
    if (!result) return sendNotFound(reply, 'Visita no encontrada')
    return { success: true }
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al actualizar visita')
  }
}

export async function deleteVisit(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const ctx = contextFromRequest(request)
    const deleted = await techservicesService.deleteVisit(ctx, request.params.id)
    if (!deleted) return sendNotFound(reply, 'Visita no encontrada')
    return { success: true }
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al eliminar visita')
  }
}

// ----- Me -----

export async function getMe(request: FastifyRequest, reply: FastifyReply) {
  try {
    const ctx = contextFromRequest(request)
    const result = await techservicesService.getMe(ctx)
    if (result && 'unauthorized' in result) {
      reply.code(401)
      return { success: false, error: result.unauthorized }
    }
    return { success: true, ...result }
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al obtener usuario')
  }
}

const preTech = [requireAuth, requireWorkifyContext]

export async function registerRoutes(fastify: FastifyInstance) {
  type Req = FastifyRequest
  type Rep = FastifyReply
  fastify.get('/api/techservices/me', { preHandler: preTech }, (req: Req, rep: Rep) => getMe(req, rep))
  fastify.get('/api/techservices/work-orders', { preHandler: preTech }, (req: Req, rep: Rep) => listWorkOrders(req, rep))
  fastify.get<{ Params: { id: string } }>('/api/techservices/work-orders/:id', { preHandler: preTech }, (req: Req, rep: Rep) => getWorkOrderById(req, rep))
  fastify.post('/api/techservices/work-orders', { preHandler: preTech }, (req: Req, rep: Rep) => createWorkOrder(req, rep))
  fastify.put<{ Params: { id: string } }>('/api/techservices/work-orders/:id', { preHandler: preTech }, (req: Req, rep: Rep) => updateWorkOrder(req, rep))
  fastify.get('/api/techservices/assets', { preHandler: preTech }, (req: Req, rep: Rep) => listAssets(req, rep))
  fastify.get<{ Params: { id: string } }>('/api/techservices/assets/:id', { preHandler: preTech }, (req: Req, rep: Rep) => getAssetById(req, rep))
  fastify.post('/api/techservices/assets', { preHandler: preTech }, (req: Req, rep: Rep) => createAsset(req, rep))
  fastify.put<{ Params: { id: string } }>('/api/techservices/assets/:id', { preHandler: preTech }, (req: Req, rep: Rep) => updateAsset(req, rep))
  fastify.delete<{ Params: { id: string } }>('/api/techservices/assets/:id', { preHandler: preTech }, (req: Req, rep: Rep) => deleteAsset(req, rep))
  fastify.get<{ Params: { id: string } }>('/api/techservices/work-orders/:id/parts', { preHandler: preTech }, (req: Req, rep: Rep) => listParts(req, rep))
  fastify.post<{ Params: { id: string } }>('/api/techservices/work-orders/:id/parts', { preHandler: preTech }, (req: Req, rep: Rep) => createPart(req, rep))
  fastify.put<{ Params: { id: string } }>('/api/techservices/parts/:id', { preHandler: preTech }, (req: Req, rep: Rep) => updatePart(req, rep))
  fastify.delete<{ Params: { id: string } }>('/api/techservices/parts/:id', { preHandler: preTech }, (req: Req, rep: Rep) => deletePart(req, rep))
  fastify.get<{ Params: { id: string } }>('/api/techservices/work-orders/:id/visits', { preHandler: preTech }, (req: Req, rep: Rep) => listVisits(req, rep))
  fastify.post<{ Params: { id: string } }>('/api/techservices/work-orders/:id/visits', { preHandler: preTech }, (req: Req, rep: Rep) => createVisit(req, rep))
  fastify.put<{ Params: { id: string } }>('/api/techservices/visits/:id', { preHandler: preTech }, (req: Req, rep: Rep) => updateVisit(req, rep))
  fastify.delete<{ Params: { id: string } }>('/api/techservices/visits/:id', { preHandler: preTech }, (req: Req, rep: Rep) => deleteVisit(req, rep))
}
