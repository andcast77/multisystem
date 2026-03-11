import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaNeon } from '@prisma/adapter-neon'
import { neonConfig } from '@neondatabase/serverless'
import ws from 'ws'
import { PrismaClient } from '../generated/prisma/client'

neonConfig.webSocketConstructor = ws

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const connectionString = process.env.DATABASE_URL ?? ''
if (!connectionString) {
  throw new Error(
    'DATABASE_URL is not set. Set it in .env (e.g. packages/api/.env or packages/database/.env) or in the environment.'
  )
}
const isLocal =
  connectionString.includes('localhost') || connectionString.includes('127.0.0.1')

const logLevel: ('query' | 'error' | 'warn')[] =
  process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']

// Prisma 7 requires an adapter. Use PrismaPg for local Postgres, PrismaNeon for Neon/cloud.
export const prisma =
  globalForPrisma.prisma ??
  (isLocal
    ? new PrismaClient({
        adapter: new PrismaPg({ connectionString }),
        log: logLevel,
      })
    : new PrismaClient({
        adapter: new PrismaNeon({ connectionString }),
        log: logLevel,
      }))

globalForPrisma.prisma = prisma

export { Prisma } from '../generated/prisma/client'
export type { PrismaClient } from '../generated/prisma/client'
