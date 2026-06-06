import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { requireAuth } from '../../core/auth.js'
import { requireCompanyContext, contextFromRequest } from '../../core/auth-context.js'
import { requireModuleAccess } from '../../core/modules.js'
import { sendNotFound, sendServerError, sendBadRequest } from '../../core/errors.js'
import { validateBody } from '../../core/validate.js'
import {
  createBaroExpedienteSchema,
  updateBaroExpedienteFullSchema,
  baroProfessionalUpsertSchema,
  baroSetTitularSchema,
} from '../../dto/baro.dto.js'
import * as baroService from '../../services/baro.service.js'

const preBaro = [requireAuth, requireCompanyContext, requireModuleAccess('baro')]

export async function registerRoutes(fastify: FastifyInstance) {
  fastify.get('/v1/baro/me', { preHandler: preBaro }, getMe)
  fastify.get('/v1/baro/profile', { preHandler: preBaro }, getTitularProfile)
  fastify.patch('/v1/baro/profile', { preHandler: preBaro }, patchTitularProfile)

  fastify.get('/v1/baro/professionals', { preHandler: preBaro }, listProfessionals)
  fastify.get('/v1/baro/professionals/list', { preHandler: preBaro }, listProfessionalsForForms)
  fastify.get('/v1/baro/professionals/collaborators', { preHandler: preBaro }, listCollaborators)
  fastify.get('/v1/baro/professionals/:id', { preHandler: preBaro }, getProfessionalById)
  fastify.post('/v1/baro/professionals', { preHandler: preBaro }, createProfessional)
  fastify.patch('/v1/baro/professionals/:id', { preHandler: preBaro }, updateProfessional)
  fastify.patch('/v1/baro/professionals/:id/active', { preHandler: preBaro }, setProfessionalActive)
  fastify.delete('/v1/baro/professionals/:id', { preHandler: preBaro }, deleteProfessional)

  fastify.get('/v1/baro/expedientes', { preHandler: preBaro }, listExpedientes)
  fastify.get('/v1/baro/expedientes/:id', { preHandler: preBaro }, getExpedienteById)
  fastify.get('/v1/baro/expedientes/:id/detail', { preHandler: preBaro }, getExpedienteDetail)
  fastify.get('/v1/baro/expedientes/:id/docx-data', { preHandler: preBaro }, getExpedienteDocxData)
  fastify.post('/v1/baro/expedientes', { preHandler: preBaro }, createExpediente)
  fastify.put('/v1/baro/expedientes/:id/full', { preHandler: preBaro }, updateExpedienteFull)
  fastify.delete('/v1/baro/expedientes/:id', { preHandler: preBaro }, deleteExpediente)
}

async function getMe(request: FastifyRequest, reply: FastifyReply) {
  try {
    const data = await baroService.getMe(contextFromRequest(request))
    return { success: true, data }
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al obtener perfil baro')
  }
}

async function getTitularProfile(request: FastifyRequest, reply: FastifyReply) {
  try {
    const profile = await baroService.getTitularProfile(contextFromRequest(request))
    return { success: true, data: { profile, publicMembrete: profile } }
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al obtener perfil titular')
  }
}

async function patchTitularProfile(request: FastifyRequest<{ Body: unknown }>, reply: FastifyReply) {
  const setParsed = baroSetTitularSchema.safeParse(request.body)
  if (setParsed.success) {
    try {
      await baroService.setTitularProfessional(
        contextFromRequest(request),
        setParsed.data.profesionalPrincipalId
      )
      return { success: true, message: 'Profesional principal actualizado.' }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error al actualizar titular'
      if (msg.includes('no encontrado')) return sendNotFound(reply, msg)
      return sendServerError(reply, error, request.log, msg)
    }
  }

  const body = validateBody(baroProfessionalUpsertSchema, request.body)
  try {
    const profile = await baroService.upsertTitularProfile(contextFromRequest(request), body)
    return { success: true, data: { profile } }
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al guardar perfil titular')
  }
}

async function listProfessionals(request: FastifyRequest, reply: FastifyReply) {
  try {
    const data = await baroService.listProfessionals(contextFromRequest(request))
    return { success: true, data }
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al listar profesionales')
  }
}

async function listProfessionalsForForms(request: FastifyRequest, reply: FastifyReply) {
  try {
    const data = await baroService.listProfessionalsForForms(contextFromRequest(request))
    return { success: true, data }
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al listar profesionales')
  }
}

async function listCollaborators(request: FastifyRequest, reply: FastifyReply) {
  try {
    const data = await baroService.listCollaborators(contextFromRequest(request))
    return { success: true, data: { professionals: data } }
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al listar colaboradores')
  }
}

async function getProfessionalById(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const data = await baroService.getProfessionalById(contextFromRequest(request), request.params.id)
    if (!data) return sendNotFound(reply, 'Profesional no encontrado')
    return { success: true, data: { professional: data } }
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al obtener profesional')
  }
}

async function createProfessional(request: FastifyRequest<{ Body: unknown }>, reply: FastifyReply) {
  const body = validateBody(baroProfessionalUpsertSchema, request.body)
  try {
    const professional = await baroService.createProfessional(contextFromRequest(request), body)
    reply.code(201)
    return { success: true, data: { professional } }
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al crear profesional')
  }
}

async function updateProfessional(
  request: FastifyRequest<{ Params: { id: string }; Body: unknown }>,
  reply: FastifyReply
) {
  const body = validateBody(baroProfessionalUpsertSchema, request.body)
  try {
    const professional = await baroService.updateProfessional(
      contextFromRequest(request),
      request.params.id,
      body
    )
    return { success: true, data: { professional } }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error al actualizar profesional'
    if (msg.includes('no encontrado')) return sendNotFound(reply, msg)
    return sendServerError(reply, error, request.log, msg)
  }
}

async function setProfessionalActive(
  request: FastifyRequest<{ Params: { id: string }; Body: unknown }>,
  reply: FastifyReply
) {
  const active = (request.body as { active?: boolean })?.active
  if (typeof active !== 'boolean') {
    return sendBadRequest(reply, 'Campo active requerido')
  }
  try {
    const professional = await baroService.setProfessionalActive(
      contextFromRequest(request),
      request.params.id,
      active
    )
    return { success: true, data: { professional } }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error al actualizar estado'
    if (msg.includes('no encontrado')) return sendNotFound(reply, msg)
    return sendServerError(reply, error, request.log, msg)
  }
}

async function deleteProfessional(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    await baroService.deleteProfessional(contextFromRequest(request), request.params.id)
    return { success: true, data: { ok: true } }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error al eliminar profesional'
    if (msg.includes('no encontrado')) return sendNotFound(reply, msg)
    if (msg.includes('expediente')) return sendBadRequest(reply, msg)
    return sendServerError(reply, error, request.log, msg)
  }
}

async function listExpedientes(request: FastifyRequest, reply: FastifyReply) {
  try {
    const data = await baroService.listExpedientes(contextFromRequest(request))
    return { success: true, data }
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al listar expedientes')
  }
}

async function getExpedienteById(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const data = await baroService.getExpedienteById(contextFromRequest(request), request.params.id)
    if (!data) return sendNotFound(reply, 'Expediente no encontrado')
    return { success: true, data }
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al obtener expediente')
  }
}

async function getExpedienteDetail(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const data = await baroService.getExpedienteDetail(contextFromRequest(request), request.params.id)
    if (!data) return sendNotFound(reply, 'Expediente no encontrado')
    return { success: true, data }
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al obtener detalle del expediente')
  }
}

async function getExpedienteDocxData(
  request: FastifyRequest<{ Params: { id: string }; Querystring: { tipo?: string } }>,
  reply: FastifyReply
) {
  const docType = request.query.tipo?.trim()
  if (!docType) return sendBadRequest(reply, 'Parámetro tipo requerido')
  try {
    const data = await baroService.getExpedienteDocxData(
      contextFromRequest(request),
      request.params.id,
      docType
    )
    if (!data) return sendNotFound(reply, 'Expediente no encontrado')
    return { success: true, data }
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al obtener datos para documento')
  }
}

async function createExpediente(request: FastifyRequest<{ Body: unknown }>, reply: FastifyReply) {
  const body = validateBody(createBaroExpedienteSchema, request.body)
  try {
    const data = await baroService.createExpediente(contextFromRequest(request), body)
    reply.code(201)
    return { success: true, data }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error al crear expediente'
    if (msg.includes('no encontrado') || msg.includes('no válido')) return sendBadRequest(reply, msg)
    return sendServerError(reply, error, request.log, 'Error al crear expediente')
  }
}

async function updateExpedienteFull(
  request: FastifyRequest<{ Params: { id: string }; Body: unknown }>,
  reply: FastifyReply
) {
  const body = validateBody(updateBaroExpedienteFullSchema, request.body)
  try {
    await baroService.updateExpedienteFull(contextFromRequest(request), request.params.id, body)
    return { success: true, message: 'Expediente guardado correctamente.' }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error al guardar expediente'
    if (msg.includes('no encontrado')) return sendNotFound(reply, msg)
    if (msg.includes('no válido')) return sendBadRequest(reply, msg)
    return sendServerError(reply, error, request.log, 'Error al guardar expediente')
  }
}

async function deleteExpediente(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    await baroService.deleteExpediente(contextFromRequest(request), request.params.id)
    return { success: true, data: { ok: true } }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error al eliminar expediente'
    if (msg.includes('no encontrado')) return sendNotFound(reply, msg)
    return sendServerError(reply, error, request.log, msg)
  }
}
