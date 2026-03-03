import 'dotenv/config'
import { defineConfig } from 'prisma/config'

const isProduction = process.env.MIGRATE_TARGET === 'production'

const datasourceUrl = isProduction
  ? process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? ''
  : (process.env.DATABASE_URL_ENV?.trim() || null) ??
    process.env.DIRECT_URL ??
    process.env.DATABASE_URL ??
    ''

// Shadow DB for migrate diff --from-migrations (replay migrations to get "from" state)
const shadowDatabaseUrl =
  process.env.SHADOW_DATABASE_URL ||
  (datasourceUrl && /localhost|127\.0\.0\.1/.test(datasourceUrl)
    ? datasourceUrl.replace(/\/[^/]*(\?.*)?$/, '/multisystem_shadow$1')
    : undefined)

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: datasourceUrl,
    ...(shadowDatabaseUrl && { shadowDatabaseUrl }),
  },
})
