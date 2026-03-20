import rateLimit from '@fastify/rate-limit'
import type { FastifyPluginAsync } from 'fastify'
import * as authController from '../../controllers/auth.controller.js'

function normalizedApiPath(url: string): string {
  const path = url.split('?')[0]
  if (path.startsWith('/api/v1/')) return path.replace('/api/v1/', '/api/')
  return path
}

function isAuthPublicPath(url: string): boolean {
  const p = normalizedApiPath(url)
  return p === '/api/auth/login' || p === '/api/auth/register' || p === '/api/auth/verify'
}

export const rateLimitPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    skip: (request) => isAuthPublicPath(request.url)
  } as Parameters<typeof fastify.register>[1])

  await fastify.register(async function authPublicScope(f) {
    await f.register(rateLimit, {
      max: 20,
      timeWindow: '1 minute',
      name: 'ms-auth-public'
    } as Parameters<typeof f.register>[1])

    await authController.registerPublicAuthRoutes(f)
  })
}

