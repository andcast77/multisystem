import type { FastifyInstance } from 'fastify'

/**
 * Adds API versioning support via URL rewriting.
 * Requests to /api/v1/* are rewritten to /api/* internally,
 * allowing clients to target the versioned URL while
 * keeping the route registration unchanged.
 *
 * When a v2 is needed, new routes register under /api/v2/*
 * while v1 continues to work via this rewrite.
 */
export function registerApiVersioning(fastify: FastifyInstance) {
  fastify.addHook('onRequest', async (request) => {
    const url = request.raw.url
    if (url && url.startsWith('/api/v1/')) {
      request.raw.url = url.replace('/api/v1/', '/api/')
    }
  })
}
