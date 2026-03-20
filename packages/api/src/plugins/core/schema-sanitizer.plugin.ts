import type { FastifyPluginAsync } from 'fastify'

// Remove `example` metadata from route schemas at registration time
function stripExamples(obj: any): any {
  if (Array.isArray(obj)) return obj.map(stripExamples)
  if (obj && typeof obj === 'object') {
    const copy: any = {}
    for (const [k, v] of Object.entries(obj)) {
      if (k === 'example') continue
      copy[k] = stripExamples(v)
    }
    return copy
  }
  return obj
}

export const schemaSanitizerPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('onRoute', (routeOptions) => {
    if (routeOptions && 'schema' in routeOptions && routeOptions.schema) {
      try {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - Fastify's RouteOptions schema is intentionally wide
        routeOptions.schema = stripExamples(routeOptions.schema)
      } catch (e) {
        fastify.log.warn({ err: e }, 'Failed stripping examples from schema')
      }
    }
  })
}

