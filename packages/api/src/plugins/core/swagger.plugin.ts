import type { FastifyPluginAsync } from 'fastify'
import { setupSwagger } from '../../swagger.js'

export type SwaggerPluginOptions = {
  nodeEnv: string
}

export const swaggerPlugin: FastifyPluginAsync<SwaggerPluginOptions> = async (fastify, opts) => {
  const enableApiDocs = opts.nodeEnv !== 'production' || process.env.ENABLE_API_DOCS === 'true'
  if (enableApiDocs) {
    await setupSwagger(fastify)
  } else {
    fastify.log.info(
      'OpenAPI UI disabled in production. Set ENABLE_API_DOCS=true to enable /api/docs.'
    )
  }
}

