import cors from '@fastify/cors'
import fp from 'fastify-plugin'
import type { FastifyPluginAsync } from 'fastify'

export type CorsPluginOptions = {
  corsOrigin: string
}

const corsPluginFn: FastifyPluginAsync<CorsPluginOptions> = async (fastify, opts) => {
  await fastify.register(cors, {
    origin: opts.corsOrigin.split(',').map((o) => o.trim()),
    credentials: true,
  })
}

export const corsPlugin = fp(corsPluginFn, { name: 'cors-plugin' })

