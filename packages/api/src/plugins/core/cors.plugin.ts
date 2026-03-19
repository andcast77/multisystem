import cors from '@fastify/cors'
import type { FastifyPluginAsync } from 'fastify'

export type CorsPluginOptions = {
  corsOrigin: string
}

export const corsPlugin: FastifyPluginAsync<CorsPluginOptions> = async (fastify, opts) => {
  await fastify.register(cors, {
    origin: opts.corsOrigin.split(',').map((o) => o.trim()),
    credentials: true
  })
}

