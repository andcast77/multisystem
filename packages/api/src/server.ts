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
import cors from '@fastify/cors'
import env from '@fastify/env'
import { setupSwagger } from './swagger.js'
import * as healthController from './controllers/health.controller.js'
import * as authController from './controllers/auth.controller.js'
import * as usersController from './controllers/users.controller.js'
import * as companiesController from './controllers/companies.controller.js'
import * as companyMembersController from './controllers/company-members.controller.js'
import * as shopflowController from './controllers/shopflow.controller.js'
import * as workifyController from './controllers/workify.controller.js'
import * as techservicesController from './controllers/techservices.controller.js'
import { registerErrorHandler } from './core/errors.js'

const __dirname = __dirnameApi
const fastify = Fastify({ logger: true })

// Esquema de variables de entorno
const envSchema = {
  type: 'object',
  required: ['DATABASE_URL'],
  properties: {
    PORT: {
      type: 'string',
      default: '3000'
    },
    CORS_ORIGIN: {
      type: 'string',
      default: 'http://localhost:3003,http://localhost:3004,http://localhost:3005'
    },
    DATABASE_URL: {
      type: 'string'
    },
    NODE_ENV: {
      type: 'string',
      default: 'development'
    },
    JWT_SECRET: {
      type: 'string',
      default: ''
    },
    JWT_EXPIRES_IN: {
      type: 'string',
      default: '7d'
    }
  }
}

async function start() {
  try {
    // Registrar y validar variables de entorno
    // Ruta explícita a .env (raíz del proyecto) para que funcione desde cualquier directorio de trabajo
    const envPath = join(__dirname, '..', '.env')
    const dotenvConfig = existsSync(envPath) ? { path: envPath } : false
    await fastify.register(env, {
      schema: envSchema,
      dotenv: dotenvConfig
    })

    // Obtener configuración validada (disponible después de registrar @fastify/env)
    const config = (fastify as any).config as {
      PORT: string
      CORS_ORIGIN: string
      DATABASE_URL: string
      NODE_ENV: string
      JWT_SECRET: string
      JWT_EXPIRES_IN: string
    }

    // Fail fast in production if JWT_SECRET is missing
    if (config.NODE_ENV === 'production' && (!config.JWT_SECRET || config.JWT_SECRET.trim() === '')) {
      fastify.log.error('JWT_SECRET is required in production. Set it in .env or environment.')
      process.exit(1)
    }

    // Registrar CORS con orígenes desde .env
    await fastify.register(cors, {
      origin: config.CORS_ORIGIN.split(','),
      credentials: true
    })

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

    fastify.addHook('onRoute', (routeOptions) => {
      if (routeOptions && 'schema' in routeOptions && routeOptions.schema) {
        try {
          // Replace schema with a version that has no `example` keys
          // This prevents Ajv strict-mode errors while keeping source files unchanged
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          routeOptions.schema = stripExamples(routeOptions.schema)
        } catch (e) {
          fastify.log.warn({ err: e }, 'Failed stripping examples from schema')
        }
      }
    })

    registerErrorHandler(fastify)

    // Registrar rutas desde controllers (cada controller registra sus paths)
    await setupSwagger(fastify)
    await healthController.registerRoutes(fastify)
    await authController.registerRoutes(fastify)
    await usersController.registerRoutes(fastify)
    await companiesController.registerRoutes(fastify)
    await companyMembersController.registerRoutes(fastify)
    await shopflowController.registerRoutes(fastify)
    await workifyController.registerRoutes(fastify)
    await techservicesController.registerRoutes(fastify)

    // Iniciar servidor
    const port = parseInt(config.PORT, 10)
    await fastify.listen({ port, host: '0.0.0.0' })
    
    console.log(`🚀 API server listening on port ${port}`)
    console.log(`📋 CORS origins: ${config.CORS_ORIGIN}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
