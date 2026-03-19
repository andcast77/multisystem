import { existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { config as loadDotenv } from 'dotenv'

// Cargar .env de la API antes de cualquier import que use Prisma (p. ej. controllers)
const __dirnameApi = dirname(fileURLToPath(import.meta.url))
const envPath = join(__dirnameApi, '..', '.env')
if (existsSync(envPath)) {
  loadDotenv({ path: envPath })
}

import Fastify from 'fastify'
import { corsPlugin } from './plugins/core/cors.plugin.js'
import { envPlugin, getValidatedConfig } from './plugins/core/env.plugin.js'
import { errorsPlugin } from './plugins/core/errors.plugin.js'
import { rateLimitPlugin } from './plugins/core/rate-limit.plugin.js'
import { schemaSanitizerPlugin } from './plugins/core/schema-sanitizer.plugin.js'
import { swaggerPlugin } from './plugins/core/swagger.plugin.js'
import { versioningPlugin } from './plugins/core/versioning.plugin.js'
import { healthPlugin } from './plugins/health/health.plugin.js'
import { authProtectedPlugin } from './plugins/auth/auth-protected.plugin.js'
import { usersPlugin } from './plugins/users/users.plugin.js'
import { tenantPlugin } from './plugins/tenant/tenant.plugin.js'
import { shopflowPlugin } from './plugins/shopflow/shopflow.plugin.js'
import { workifyPlugin } from './plugins/workify/workify.plugin.js'
import { techservicesPlugin } from './plugins/techservices/techservices.plugin.js'
import { getConfig, type AppConfig } from './core/config.js'

const __dirname = __dirnameApi
const fastify = Fastify({ logger: true })

async function start() {
  try {
    // Registrar y validar variables de entorno
    // Ruta explícita a .env (raíz del proyecto) para que funcione desde cualquier directorio de trabajo
    await fastify.register(envPlugin, { entryDir: __dirname })

    // Obtener configuración validada (disponible después de registrar @fastify/env)
    // Under Vitest we may import/boot the app without an active Fastify "ready" cycle.
    // Fall back to the process.env-backed config helper so integration tests can boot.
    const config = (getValidatedConfig(fastify) as AppConfig | undefined) ?? getConfig()

    const isTest = process.env.VITEST === 'true' || process.env.NODE_ENV === 'test'
    const deployed =
      process.env.VERCEL === '1' ||
      config.NODE_ENV === 'production' ||
      config.NODE_ENV === 'staging'
    if (!isTest && deployed && (!config.JWT_SECRET || config.JWT_SECRET.trim() === '')) {
      fastify.log.error('JWT_SECRET is required in deployed environments (production, staging, Vercel).')
      if (process.env.VERCEL) {
        throw new Error('JWT_SECRET is required. Set it in project environment variables.')
      }
      process.exit(1)
    }
    if (
      !isTest &&
      config.NODE_ENV === 'development' &&
      (!config.JWT_SECRET || config.JWT_SECRET.trim() === '')
    ) {
      fastify.log.warn(
        'JWT_SECRET is unset; API falls back to a dev default. Set JWT_SECRET in packages/api/.env for realistic auth behavior.'
      )
    }

    // Registrar CORS con orígenes desde .env
    await fastify.register(corsPlugin, { corsOrigin: config.CORS_ORIGIN })
    await fastify.register(rateLimitPlugin)
    await fastify.register(schemaSanitizerPlugin)
    await fastify.register(errorsPlugin)
    await fastify.register(versioningPlugin)
    await fastify.register(swaggerPlugin, { nodeEnv: config.NODE_ENV })

    await fastify.register(healthPlugin)
    await fastify.register(authProtectedPlugin)
    await fastify.register(usersPlugin)
    await fastify.register(tenantPlugin)
    await fastify.register(shopflowPlugin)
    await fastify.register(workifyPlugin)
    await fastify.register(techservicesPlugin)

    // On Vercel we export the app for serverless; locally we listen
    if (!process.env.VERCEL) {
      const port = parseInt(config.PORT, 10)
      await fastify.listen({ port, host: '0.0.0.0' })
      console.log(`🚀 API server listening on port ${port}`)
      console.log(`📋 CORS origins: ${config.CORS_ORIGIN}`)
    }
    return fastify
  } catch (err) {
    fastify.log.error(err)
    if (process.env.VERCEL) {
      throw err
    }
    process.exit(1)
  }
}

// Export for Vercel serverless; run listen() when executed directly
const app = await start()
export default app
