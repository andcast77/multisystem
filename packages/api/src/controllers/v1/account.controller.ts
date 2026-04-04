import type { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify'
import { requireAuth } from '../../core/auth.js'
import { ok } from '../../common/api-response.js'
import * as accountService from '../../services/account.service.js'

async function getMyData(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user!.id
  const data = await accountService.exportMyData(userId)
  reply.header('Content-Disposition', 'attachment; filename="my-data.json"')
  return ok(data)
}

async function deleteMyData(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user!.id
  const result = await accountService.anonymizeMyData(userId)
  return ok(result)
}

async function acceptPrivacy(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user!.id
  const result = await accountService.acceptPrivacy(userId)
  return ok(result)
}

export async function registerRoutes(fastify: FastifyInstance) {
  const guard = [requireAuth]

  fastify.get('/v1/account/my-data', { preHandler: guard }, (req, rep) => getMyData(req, rep))
  fastify.delete('/v1/account/my-data', { preHandler: guard }, (req, rep) => deleteMyData(req, rep))
  fastify.post('/v1/account/accept-privacy', { preHandler: guard }, (req, rep) => acceptPrivacy(req, rep))
}
