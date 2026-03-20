import type { FastifyPluginAsync } from 'fastify'
import { registerApiVersioning } from '../../common/versioned-routes.js'

export const versioningPlugin: FastifyPluginAsync = async (fastify) => {
  registerApiVersioning(fastify)
}

