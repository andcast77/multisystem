/**
 * Vercel serverless handler: forwards all requests to the Fastify app via inject.
 * Rewrite "/(.*)" -> "/api" in vercel.json so this handler receives every request.
 */

let appPromise: Promise<import('fastify').FastifyInstance> | null = null

function getApp() {
  if (!appPromise) {
    // Dynamic import so dist/server.js is used after build
    appPromise = import('../dist/server.js').then((m) => m.default)
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
  async fetch(request: Request): Promise<Response> {
    const app = await getApp()
    const url = new URL(request.url)
    // Rewrite sends to /api/:path so pathname is /api/health or /api/api/docs; strip /api prefix for Fastify
    const pathname = url.pathname.replace(/^\/api/, '') || '/'
    const path = pathname + url.search
    const headers: Record<string, string> = {}
    request.headers.forEach((value, key) => {
      headers[key] = value
    })
    const body = await request.text().catch(() => '')
    const payload = body || undefined

    const response = await app.inject({
      method: request.method,
      url: path,
      headers,
      payload
    })

    return new Response(response.body, {
      status: response.statusCode,
      headers: headersFromFastify(response.headers as Record<string, string | string[] | undefined>)
    })
  }
}
