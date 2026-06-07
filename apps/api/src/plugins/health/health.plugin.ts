import type { FastifyPluginAsync } from 'fastify'
import * as healthController from '../../controllers/health.controller.js'

export const healthPlugin: FastifyPluginAsync = async (fastify) => {
  await healthController.registerRoutes(fastify)
}

