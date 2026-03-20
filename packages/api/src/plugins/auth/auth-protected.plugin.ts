import type { FastifyPluginAsync } from 'fastify'
import * as authController from '../../controllers/auth.controller.js'

export const authProtectedPlugin: FastifyPluginAsync = async (fastify) => {
  await authController.registerProtectedAuthRoutes(fastify)
}

