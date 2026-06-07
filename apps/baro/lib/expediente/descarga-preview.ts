import { NextResponse } from 'next/server'

/** When `preview=1` is used, serve the same bytes with `Content-Disposition: inline`. */
export function withExpedienteDocxPreviewDisposition(
  response: NextResponse,
  preview: boolean
): NextResponse {
  if (!preview || response.status !== 200) {
    return response
  }
  const headers = new Headers(response.headers)
  const cd = headers.get('Content-Disposition')
  if (cd?.startsWith('attachment')) {
    headers.set('Content-Disposition', cd.replace(/^attachment/, 'inline'))
  }
  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

/** ETag + private no-cache for preview / client revalidation. */
export function withExpedienteDocxPreviewCacheHeaders(
  response: NextResponse,
  etag: string
): NextResponse {
  const headers = new Headers(response.headers)
  headers.set('ETag', etag)
  headers.set('Cache-Control', 'private, no-cache')
  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}
