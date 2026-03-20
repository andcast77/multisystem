import type { FastifyPluginAsync } from 'fastify'
import { globalErrorHandler } from '../../common/errors/index.js'

export const errorsPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.setErrorHandler(globalErrorHandler)
}

