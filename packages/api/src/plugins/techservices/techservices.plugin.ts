import type { FastifyPluginAsync } from 'fastify'
import * as techservicesController from '../../controllers/techservices.controller.js'

export const techservicesPlugin: FastifyPluginAsync = async (fastify) => {
  await techservicesController.registerRoutes(fastify)
}

