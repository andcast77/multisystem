/**
 * Smoke load contra GET /health (autocannon).
 * @see https://fastify.dev/docs/latest/Guides/Recommendations/
 *
 * Uso:
 *   node scripts/load-smoke.mjs [urlBase] [conexiones] [segundos]
 * Por defecto: http://127.0.0.1:$PORT/health, 10 conexiones, 5s ($PORT de entorno o 3000).
 */

import autocannon, { printResult } from 'autocannon'

const argv = process.argv.slice(2)
const port = process.env.PORT?.trim() || '3000'

function resolveUrl() {
  const raw = argv[0]?.trim()
  if (!raw) return `http://127.0.0.1:${port}/health`
  const base = raw.replace(/\/$/, '')
  if (base.endsWith('/health')) return base
  return `${base}/health`
}

const connections = Math.max(1, Number.parseInt(argv[1] ?? '10', 10) || 10)
const duration = Math.max(1, Number.parseInt(argv[2] ?? '5', 10) || 5)
const url = resolveUrl()

const result = await autocannon({
  url,
  connections,
  duration,
})

process.stdout.write(`${printResult(result)}\nTarget: ${url}\n`)
