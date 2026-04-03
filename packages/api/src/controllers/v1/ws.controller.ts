import type { FastifyInstance, FastifyRequest } from 'fastify'
import type { WebSocket } from '@fastify/websocket'
import { requireAuth } from '../../core/auth.js'
import { assertCompanyAccess } from '../../policies/company-authorization.policy.js'
import { presenceService } from '../../services/presence.service.js'
import { userDisplayName } from '../../core/auth.js'

type Params = { companyId: string }

async function requireCompanyScope(
  request: FastifyRequest<{ Params: Params }>
): Promise<void> {
  assertCompanyAccess(request.user!, request.params.companyId)
}

function handleConnection(
  socket: WebSocket,
  request: FastifyRequest<{ Params: Params }>
): void {
  const { companyId } = request.params
  const user = request.user!
  const userId = user.id
  const name = userDisplayName({ email: user.email })

  const joined = presenceService.join(companyId, userId, name, socket)
  if (!joined) {
    socket.close(1013, 'Too many connections for this tenant')
    return
  }

  const presence = presenceService.getPresence(companyId)
  socket.send(JSON.stringify({ event: 'presence:sync', data: { users: presence } }))

  presenceService.broadcast(
    companyId,
    'user:joined',
    { userId, name },
    userId
  )

  socket.on('close', () => {
    presenceService.leave(companyId, userId)
    presenceService.broadcast(companyId, 'user:left', { userId, name })
  })

  socket.on('error', () => {
    presenceService.leave(companyId, userId)
  })
}

export async function registerRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get<{ Params: Params }>(
    '/v1/ws/presence/:companyId',
    {
      websocket: true,
      preHandler: [requireAuth, requireCompanyScope],
    },
    handleConnection
  )
}
