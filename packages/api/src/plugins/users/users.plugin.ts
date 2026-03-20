import type { FastifyPluginAsync } from 'fastify'
import * as usersController from '../../controllers/users.controller.js'

export const usersPlugin: FastifyPluginAsync = async (fastify) => {
  await usersController.registerRoutes(fastify)
}

