import type { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify'
import { z } from 'zod'
import { requireAuth } from '../../core/auth.js'
import { requireCompanyContext, requireRole } from '../../core/auth-context.js'
import { validateBody } from '../../core/validate.js'
import { ok } from '../../common/api-response.js'
import * as memberRbacService from '../../services/member-rbac.service.js'

// ---------------------------------------------------------------------------
// DTOs / validation
// ---------------------------------------------------------------------------

const updateModulesBodySchema = z.object({
  modules: z.array(
    z.object({
      moduleId: z.string().uuid(),
      enabled: z.boolean(),
    })
  ).min(1),
})

const updateRolesBodySchema = z.object({
  roleIds: z.array(z.string().uuid()),
})

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

async function getMemberModules(
  request: FastifyRequest<{ Params: { companyId: string; memberId: string } }>,
  _reply: FastifyReply
) {
  const { companyId, memberId } = request.params
  const data = await memberRbacService.getMemberModules(companyId, memberId, request.user!)
  return ok(data)
}

async function updateMemberModules(
  request: FastifyRequest<{ Params: { companyId: string; memberId: string }; Body: unknown }>,
  _reply: FastifyReply
) {
  const { companyId, memberId } = request.params
  const body = validateBody(updateModulesBodySchema, request.body)
  const data = await memberRbacService.updateMemberModules(companyId, memberId, body, request.user!)
  return ok(data)
}

async function getMemberRoles(
  request: FastifyRequest<{ Params: { companyId: string; memberId: string } }>,
  _reply: FastifyReply
) {
  const { companyId, memberId } = request.params
  const data = await memberRbacService.getMemberRoles(companyId, memberId, request.user!)
  return ok(data)
}

async function updateMemberRoles(
  request: FastifyRequest<{ Params: { companyId: string; memberId: string }; Body: unknown }>,
  _reply: FastifyReply
) {
  const { companyId, memberId } = request.params
  const body = validateBody(updateRolesBodySchema, request.body)
  const data = await memberRbacService.updateMemberRoles(companyId, memberId, body, request.user!)
  return ok(data)
}

// ---------------------------------------------------------------------------
// Route registration
// ---------------------------------------------------------------------------

const adminGuard = [requireAuth, requireCompanyContext, requireRole(['OWNER', 'ADMIN'])]

export async function registerRoutes(fastify: FastifyInstance) {
  fastify.get<{ Params: { companyId: string; memberId: string } }>(
    '/v1/companies/:companyId/members/:memberId/modules',
    { preHandler: adminGuard },
    (req, rep) => getMemberModules(req, rep)
  )

  fastify.put<{ Params: { companyId: string; memberId: string }; Body: unknown }>(
    '/v1/companies/:companyId/members/:memberId/modules',
    { preHandler: adminGuard },
    (req, rep) => updateMemberModules(req, rep)
  )

  fastify.get<{ Params: { companyId: string; memberId: string } }>(
    '/v1/companies/:companyId/members/:memberId/roles',
    { preHandler: adminGuard },
    (req, rep) => getMemberRoles(req, rep)
  )

  fastify.put<{ Params: { companyId: string; memberId: string }; Body: unknown }>(
    '/v1/companies/:companyId/members/:memberId/roles',
    { preHandler: adminGuard },
    (req, rep) => updateMemberRoles(req, rep)
  )
}
