/**
 * Vercel serverless handler: forwards all requests to the Fastify app via inject.
 * Rewrite "/(.*)" -> "/api" in vercel.json so this handler receives every request.
 */

import { join, dirname } from 'path'
import { pathToFileURL } from 'url'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

/** HTTP method union expected by Fastify inject (request.method is string) */
type HTTPMethods = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS'

/** Shape of the object returned by Fastify inject() when called with options (not chain) */
interface InjectResponse {
  statusCode: number
  headers: Record<string, string | string[] | undefined>
  body: string | Buffer | null
}

/** Web Fetch API Request shape used by Vercel's default handler signature */
interface FetchRequest {
  url: string
  method: string
  headers: Headers
  text(): Promise<string>
}

let appPromise: Promise<import('fastify').FastifyInstance> | null = null

function getApp() {
  if (!appPromise) {
    // Path relative to this file: api/index.js -> ../dist/server.js
    const serverPath = join(__dirname, '..', 'dist', 'server.js')
    appPromise = import(pathToFileURL(serverPath).href).then((m: { default: import('fastify').FastifyInstance }) => m.default)
  }
  return appPromise
}

function headersFromFastify(headers: Record<string, string | string[] | undefined>): Headers {
  const out = new Headers()
  for (const [key, value] of Object.entries(headers)) {
    if (value === undefined) continue
    if (Array.isArray(value)) {
      value.forEach((v) => out.append(key, v))
    } else {
      out.set(key, value)
    }
  }
  return out
}

export default {
  async fetch(request: FetchRequest): Promise<Response> {
    try {
      const app = await getApp()
      const url = new URL(request.url)
      // Rewrite sends to /api/:path so pathname is /api/health or /api/api/docs; strip /api prefix for Fastify
      const pathname = url.pathname.replace(/^\/api/, '') || '/'
      const path = pathname + url.search
      const headers: Record<string, string> = {}
      const reqHeaders = request.headers as unknown as { entries(): IterableIterator<[string, string]> }
      for (const [key, value] of reqHeaders.entries()) {
        headers[key] = value
      }
      const body = await request.text().catch(() => '')
      const payload = body || undefined

      const response = (await app.inject({
        method: request.method as HTTPMethods,
        url: path,
        headers,
        payload
      })) as InjectResponse

      const bodyOut = response.body != null ? response.body : undefined
      return new Response(bodyOut, {
        status: response.statusCode,
        headers: headersFromFastify(response.headers)
      })
    } catch (err) {
      console.error('[api]', err)
      const message = err instanceof Error ? err.message : String(err)
      // Startup/load failures (e.g. missing env, failed import) -> 503 so client knows service is unavailable
      const status = message && /required|failed|cannot find|ENOENT|MODULE_NOT_FOUND/i.test(message) ? 503 : 500
      return new Response(
        JSON.stringify({ error: status === 503 ? 'Service Unavailable' : 'Internal Server Error', message: process.env.VERCEL ? message : undefined }),
        { status, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }
}
