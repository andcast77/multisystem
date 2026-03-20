import type { FastifyPluginAsync } from 'fastify'
import * as companiesController from '../../controllers/companies.controller.js'
import * as companyMembersController from '../../controllers/company-members.controller.js'

export const tenantPlugin: FastifyPluginAsync = async (fastify) => {
  await companiesController.registerRoutes(fastify)
  await companyMembersController.registerRoutes(fastify)
}

