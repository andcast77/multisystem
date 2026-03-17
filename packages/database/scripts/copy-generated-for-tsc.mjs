/**
 * After Prisma generates into dist/generated/prisma, copy that tree to
 * generated/prisma so that src/client.ts can resolve '../generated/prisma/client'
 * at compile time. The emitted dist/src/client.js still imports from
 * '../generated/prisma/client.js', which resolves to dist/generated/prisma at runtime.
 */
import { cpSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const distGenerated = join(process.cwd(), 'dist', 'generated')
const outGenerated = join(process.cwd(), 'generated')

if (!existsSync(distGenerated)) {
  console.error('copy-generated-for-tsc: dist/generated not found (run prisma generate first)')
  process.exit(1)
}

cpSync(distGenerated, outGenerated, { recursive: true })
