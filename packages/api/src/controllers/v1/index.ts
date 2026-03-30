import type { FastifyInstance } from 'fastify'
import * as auth from './auth.controller.js'
import * as users from './users.controller.js'
import * as companies from './companies.controller.js'
import * as companyMembers from './company-members.controller.js'
import * as shopflow from './shopflow/index.js'
import * as workify from './workify.controller.js'
import * as techservices from './techservices.controller.js'

/**
 * Registers all v1 HTTP routes except public auth (login/register/verify),
 * which stay under the stricter rate-limit scope in `rate-limit.plugin.ts`.
 */
export async function registerV1(fastify: FastifyInstance) {
  await auth.registerProtectedAuthRoutes(fastify)
  await users.registerRoutes(fastify)
  await companies.registerRoutes(fastify)
  await companyMembers.registerRoutes(fastify)
  await shopflow.registerRoutes(fastify)
  await workify.registerRoutes(fastify)
  await techservices.registerRoutes(fastify)
}
