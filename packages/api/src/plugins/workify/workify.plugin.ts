import type { FastifyPluginAsync } from 'fastify'
import * as workifyController from '../../controllers/workify.controller.js'

export const workifyPlugin: FastifyPluginAsync = async (fastify) => {
  await workifyController.registerRoutes(fastify)
}

