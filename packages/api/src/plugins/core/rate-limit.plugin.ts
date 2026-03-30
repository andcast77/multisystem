/**
 * Rate limits key off `request.ip`. Enable `TRUST_PROXY` (see `.env.example`) when the API sits
 * behind a reverse proxy or Vercel so forwarded headers resolve to the real client; otherwise every
 * user can share one bucket (proxy IP). @see https://fastify.dev/docs/latest/Guides/Recommendations/
 */
import rateLimit from '@fastify/rate-limit'
import type { FastifyPluginAsync } from 'fastify'
import * as authController from '../../controllers/v1/auth.controller.js'

function pathOnly(url: string): string {
  return url.split('?')[0]
}

function isAuthPublicPath(url: string): boolean {
  const p = pathOnly(url)
  return p === '/v1/auth/login' || p === '/v1/auth/register' || p === '/v1/auth/verify'
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

