import type { FastifyRequest, FastifyReply } from 'fastify'
import type { FastifyInstance } from 'fastify'
import { verifyToken, requireAuth } from '../core/auth.js'
import { sendBadRequest, sendForbidden, sendServerError } from '../core/errors.js'
import { validateOr400 } from '../core/validate.js'
import { loginBodySchema, registerBodySchema } from '../dto/auth.dto.js'
import * as authService from '../services/auth.service.js'

export async function login(request: FastifyRequest, reply: FastifyReply) {
  try {
    const body = validateOr400(reply, loginBodySchema, request.body)
    if (body === null) return

    const result = await authService.login(body)

    if ('error' in result) {
      reply.code(result.code)
      return { success: false, error: result.error }
    }

    return { success: true, data: result }
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al autenticar usuario')
  }
}

export async function register(request: FastifyRequest, reply: FastifyReply) {
  try {
    const body = validateOr400(reply, registerBodySchema, request.body)
    if (body === null) return

    const result = await authService.register(body)

    if ('error' in result) {
      reply.code(result.code)
      return { success: false, error: result.error }
    }

    return { success: true, data: result }
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al registrar usuario')
  }
}

export async function me(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      reply.code(401)
      return { success: false, error: 'Token de autenticación requerido' }
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)

    if (!decoded) {
      reply.code(401)
      return { success: false, error: 'Token inválido o expirado' }
    }

    const result = await authService.me(decoded)

    if ('error' in result) {
      reply.code(result.code)
      return { success: false, error: result.error }
    }

    return { success: true, data: result }
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al obtener usuario')
  }
}

export async function logout(_request: FastifyRequest, reply: FastifyReply) {
  reply.code(200)
  return { success: true }
}

export async function verify(request: FastifyRequest<{ Body: { token: string } }>, reply: FastifyReply) {
  try {
    const { token } = request.body
    const result = await authService.verify(token)
    if (!result.valid) {
      reply.code(result.code)
      return { success: false, error: result.error }
    }
    return { success: true, data: { valid: true, user: result.user } }
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error al verificar token')
  }
}

export async function listCompanies(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      reply.code(401)
      return { success: false, error: 'Token de autenticación requerido' }
    }
    const decoded = verifyToken(authHeader.substring(7))
    if (!decoded) {
      reply.code(401)
      return { success: false, error: 'Token inválido o expirado' }
    }
    const companies = await authService.getCompanies(decoded.id, decoded.isSuperuser ?? false)
    return { success: true, data: companies }
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error')
  }
}

export async function setContext(
  request: FastifyRequest<{ Body: { companyId: string } }>,
  reply: FastifyReply
) {
  try {
    const authHeader = request.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      reply.code(401)
      return { success: false, error: 'Token de autenticación requerido' }
    }
    const decoded = verifyToken(authHeader.substring(7))
    if (!decoded) {
      reply.code(401)
      return { success: false, error: 'Token inválido o expirado' }
    }
    const { companyId } = request.body
    if (!companyId) {
      reply.code(400)
      return { success: false, error: 'companyId es requerido' }
    }
    const result = await authService.setContext(decoded, companyId)
    if ('error' in result) {
      reply.code(result.code)
      return { success: false, error: result.error }
    }
    return { success: true, data: result }
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error')
  }
}

export async function createSession(
  request: FastifyRequest<{
    Body: {
      userId: string
      sessionToken: string
      ipAddress?: string
      userAgent?: string
      expiresAt?: string
    }
  }>,
  reply: FastifyReply
) {
  try {
    const decoded = request.user!
    const body = request.body
    if (decoded.id !== body.userId && !decoded.isSuperuser) {
      return sendForbidden(reply, 'Solo puedes crear sesión para tu propio usuario')
    }
    const result = await authService.createSession(body)
    if ('error' in result) {
      reply.code(result.code)
      return { success: false, error: result.error }
    }
    return { success: true }
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error')
  }
}

export async function validateSession(
  request: FastifyRequest<{ Querystring: { token?: string } }>,
  reply: FastifyReply
) {
  try {
    const { token } = request.query
    if (!token) {
      reply.code(400)
      return { success: false, data: { valid: false } }
    }
    const result = await authService.validateSession(token)
    return { success: true, data: result }
  } catch (error) {
    request.log.error(error)
    reply.code(500)
    return { success: false, data: { valid: false } }
  }
}

export async function listSessions(
  request: FastifyRequest<{ Querystring: { userId: string } }>,
  reply: FastifyReply
) {
  try {
    const decoded = request.user!
    const { userId } = request.query
    if (!userId) return sendBadRequest(reply, 'userId es requerido')
    if (decoded.id !== userId && !decoded.isSuperuser) {
      return sendForbidden(reply, 'Solo puedes listar tus propias sesiones')
    }
    const rows = await authService.listSessions(userId)
    return { success: true, data: rows }
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error')
  }
}

export async function deleteSession(
  request: FastifyRequest<{ Params: { token: string } }>,
  reply: FastifyReply
) {
  try {
    const caller = request.user!
    const { token } = request.params
    const result = await authService.deleteSession(token, caller.id, caller.isSuperuser ?? false)
    if ('error' in result) {
      reply.code(result.code)
      return { success: false, error: result.error }
    }
    return { success: true }
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error')
  }
}

export async function terminateOthersSessions(
  request: FastifyRequest<{ Body: { userId: string; currentSessionToken: string } }>,
  reply: FastifyReply
) {
  try {
    const caller = request.user!
    const { userId, currentSessionToken } = request.body
    if (!userId || !currentSessionToken) {
      return sendBadRequest(reply, 'userId y currentSessionToken son requeridos')
    }
    if (caller.id !== userId && !caller.isSuperuser) {
      return sendForbidden(reply, 'Solo puedes terminar tus propias sesiones')
    }
    const result = await authService.terminateOthersSessions(
      userId,
      currentSessionToken,
      caller.id,
      caller.isSuperuser ?? false
    )
    if ('error' in result) {
      reply.code(result.code)
      return { success: false, error: result.error }
    }
    return { success: true }
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error')
  }
}

export async function cleanupExpiredSessions(request: FastifyRequest, reply: FastifyReply) {
  try {
    const result = await authService.cleanupExpiredSessions(request.user?.isSuperuser ?? false)
    if ('error' in result) {
      reply.code(result.code)
      return { success: false, error: result.error }
    }
    return { success: true, data: { count: result.count } }
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error')
  }
}

export async function updateConcurrentSessions(
  request: FastifyRequest<{ Params: { userId: string }; Body: { allowConcurrentSessions?: boolean } }>,
  reply: FastifyReply
) {
  try {
    const caller = request.user!
    const { userId } = request.params
    const result = await authService.updateConcurrentSessions(
      userId,
      caller.id,
      caller.isSuperuser ?? false
    )
    if ('error' in result) {
      reply.code(result.code)
      return { success: false, error: result.error }
    }
    return { success: true }
  } catch (error) {
    return sendServerError(reply, error, request.log, 'Error')
  }
}

export async function registerRoutes(fastify: FastifyInstance) {
  type Req = FastifyRequest
  type Rep = FastifyReply
  fastify.post<{ Body: { email: string; password: string; companyId?: string } }>(
    '/api/auth/login',
    (request: Req, reply: Rep) => login(request, reply)
  )
  fastify.post('/api/auth/logout', (request: Req, reply: Rep) => logout(request, reply))
  fastify.post<{ Body: { email: string; password: string; firstName?: string; lastName?: string; companyName?: string; workifyEnabled?: boolean; shopflowEnabled?: boolean; technicalServicesEnabled?: boolean } }>(
    '/api/auth/register',
    (request: Req, reply: Rep) => register(request, reply)
  )
  fastify.get('/api/auth/me', (request: Req, reply: Rep) => me(request, reply))
  fastify.post<{ Body: { token: string } }>('/api/auth/verify', (request: Req, reply: Rep) => verify(request, reply))
  fastify.get('/api/auth/companies', (request: Req, reply: Rep) => listCompanies(request, reply))
  fastify.post<{ Body: { companyId: string } }>('/api/auth/context', (request: Req, reply: Rep) => setContext(request, reply))
  fastify.post<{
    Body: { userId: string; sessionToken: string; ipAddress?: string; userAgent?: string; expiresAt?: string }
  }>('/api/auth/sessions', { preHandler: [requireAuth] }, (request: Req, reply: Rep) => createSession(request, reply))
  fastify.get<{ Querystring: { token: string } }>(
    '/api/auth/sessions/validate',
    (request: Req, reply: Rep) => validateSession(request, reply)
  )
  fastify.get<{ Querystring: { userId: string } }>(
    '/api/auth/sessions',
    { preHandler: [requireAuth] },
    (request: Req, reply: Rep) => listSessions(request, reply)
  )
  fastify.delete<{ Params: { token: string } }>(
    '/api/auth/sessions/:token',
    { preHandler: [requireAuth] },
    (request: Req, reply: Rep) => deleteSession(request, reply)
  )
  fastify.post<{ Body: { userId: string; currentSessionToken: string } }>(
    '/api/auth/sessions/terminate-others',
    { preHandler: [requireAuth] },
    (request: Req, reply: Rep) => terminateOthersSessions(request, reply)
  )
  fastify.post(
    '/api/auth/sessions/cleanup-expired',
    { preHandler: [requireAuth] },
    (request: Req, reply: Rep) => cleanupExpiredSessions(request, reply)
  )
  fastify.put<{ Params: { userId: string }; Body: { allowConcurrentSessions?: boolean } }>(
    '/api/auth/users/:userId/concurrent-sessions',
    { preHandler: [requireAuth] },
    (request: Req, reply: Rep) => updateConcurrentSessions(request, reply)
  )
}
