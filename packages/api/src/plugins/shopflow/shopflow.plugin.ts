import type { FastifyPluginAsync } from 'fastify'
import * as shopflowController from '../../controllers/shopflow/index.js'

export const shopflowPlugin: FastifyPluginAsync = async (fastify) => {
  await shopflowController.registerRoutes(fastify)
}

