import type { FastifyInstance } from 'fastify'

export async function registerRoutes(fastify: FastifyInstance) {
  fastify.get('/health', {
    schema: {
      description: 'Verifica el estado de salud del API.',
      tags: ['Health'],
      response: {
        200: {
          description: 'API funcionando',
          type: 'object',
          properties: {
            status: { type: 'string', example: 'ok' }
          }
        }
      }
    }
  }, async () => ({ status: 'ok' }))
}
