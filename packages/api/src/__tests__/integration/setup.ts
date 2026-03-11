/**
 * Integration test setup with testcontainers.
 *
 * To use testcontainers, install: pnpm add -D testcontainers @testcontainers/postgresql
 * Then uncomment the PostgreSqlContainer setup below.
 *
 * For now, integration tests run against the DATABASE_URL environment variable
 * (set in CI via GitHub Actions postgres service).
 */
import { beforeAll, afterAll } from 'vitest'

// Uncomment when testcontainers is installed:
// import { PostgreSqlContainer } from '@testcontainers/postgresql'
//
// let container: Awaited<ReturnType<PostgreSqlContainer['start']>>
//
// beforeAll(async () => {
//   container = await new PostgreSqlContainer('postgres:16-alpine').start()
//   process.env.DATABASE_URL = container.getConnectionUri()
//   // Run migrations here
// }, 60_000)
//
// afterAll(async () => {
//   await container?.stop()
// })

beforeAll(() => {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL must be set for integration tests. ' +
      'Use docker-compose up -d or install @testcontainers/postgresql.'
    )
  }
})
