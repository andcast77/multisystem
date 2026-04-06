import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { requireAuth } from '../../core/auth.js'
import { getConfig } from '../../core/config.js'
import { applyCorsHeadersToRawResponse, parseCorsOriginList } from '../../core/cors-reflect.js'
import { assertCompanyAccess } from '../../policies/company-authorization.policy.js'
import { sseManager } from '../../services/sse.service.js'

type Params = { companyId: string }

async function requireCompanyScope(
  request: FastifyRequest<{ Params: Params }>,
  _reply: FastifyReply
): Promise<void> {
  assertCompanyAccess(request.user!, request.params.companyId)
}

async function streamMetrics(
  request: FastifyRequest<{ Params: Params }>,
  reply: FastifyReply
): Promise<void> {
  const { companyId } = request.params
  const raw = reply.raw
  const allowedOrigins = parseCorsOriginList(getConfig().CORS_ORIGIN)

  reply.hijack()
  // Hijacked responses skip @fastify/cors hooks; mirror CORS policy for EventSource (credentials).
  applyCorsHeadersToRawResponse(raw, request.headers.origin, allowedOrigins)
  raw.setHeader('Content-Type', 'text/event-stream')
  raw.setHeader('Cache-Control', 'no-cache, no-transform')
  raw.setHeader('Connection', 'keep-alive')
  raw.setHeader('X-Accel-Buffering', 'no')
  raw.flushHeaders()

  let client: ReturnType<typeof sseManager.addClient> | null = null
  try {
    client = sseManager.addClient(companyId, raw)
  } catch {
    raw.statusCode = 429
    raw.end('event: error\ndata: {"message":"Too many connections"}\n\n')
    return
  }

  raw.write('event: connected\ndata: {"status":"ok"}\n\n')

  request.raw.on('close', () => {
    if (client) sseManager.removeClient(companyId, client)
  })
}

export async function registerRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get<{ Params: Params }>(
    '/v1/events/metrics/:companyId',
    { preHandler: [requireAuth, requireCompanyScope] },
    streamMetrics
  )
}
