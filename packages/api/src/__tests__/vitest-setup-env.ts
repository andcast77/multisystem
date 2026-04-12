/**
 * Carga `packages/api/.env` si existe (mismo criterio que `server.ts`), para tests que llaman `getConfig()`.
 */
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { config as loadDotenv } from 'dotenv'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = join(__dirname, '..', '..', '.env')
if (existsSync(envPath)) {
  loadDotenv({ path: envPath })
}
