/**
 * Smoke load against GET /health using autocannon (Fastify recommends k6 or autocannon for capacity planning).
 * @see https://fastify.dev/docs/latest/Guides/Recommendations/
 *
 * Env:
 *   LOAD_TEST_URL   — base or full URL (default http://127.0.0.1:$PORT)
 *   LOAD_TEST_CONNECTIONS — concurrent connections (default 10)
 *   LOAD_TEST_DURATION    — seconds (default 5)
 *
 * Sizing (from Fastify doc, rule of thumb): ~2 vCPU per instance for lowest latency; 1 vCPU can maximize
 * throughput per core. Validate on real CPU (bare metal vs vCPU vs serverless).
 */

import autocannon, { printResult } from 'autocannon'

function resolveUrl() {
  const raw = process.env.LOAD_TEST_URL?.trim()
  const port = process.env.PORT?.trim() || '3000'
  if (!raw) return `http://127.0.0.1:${port}/health`
  const base = raw.replace(/\/$/, '')
  if (base.endsWith('/health')) return base
  return `${base}/health`
}

const connections = Math.max(1, Number.parseInt(process.env.LOAD_TEST_CONNECTIONS ?? '10', 10) || 10)
const duration = Math.max(1, Number.parseInt(process.env.LOAD_TEST_DURATION ?? '5', 10) || 5)
const url = resolveUrl()

const result = await autocannon({
  url,
  connections,
  duration,
})

process.stdout.write(`${printResult(result)}\nTarget: ${url}\n`)
