import fastifyWebsocket from '@fastify/websocket'
import fp from 'fastify-plugin'
import type { FastifyPluginAsync } from 'fastify'

const websocketPluginFn: FastifyPluginAsync = async (fastify) => {
  await fastify.register(fastifyWebsocket)
}

export const websocketPlugin = fp(websocketPluginFn, { name: 'websocket-plugin' })
