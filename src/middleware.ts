import { NextRequest, NextResponse } from 'next/server'

async function proxyRequest(
  request: NextRequest,
  targetUrl: string,
  pathname: string
): Promise<NextResponse> {
  try {
    const url = new URL(pathname + request.nextUrl.search, targetUrl)

    const headers = new Headers()
    const skipHeaders = ['host', 'connection', 'upgrade', 'keep-alive', 'transfer-encoding']

    request.headers.forEach((value, key) => {
      if (!skipHeaders.includes(key.toLowerCase())) {
        headers.set(key, value)
      }
    })

    headers.set('host', new URL(targetUrl).host)
    headers.set('x-forwarded-host', request.headers.get('host') || '')
    headers.set('x-forwarded-proto', request.nextUrl.protocol.slice(0, -1))
    headers.set('x-forwarded-for', request.ip || '')

    let body: string | undefined
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      try {
        body = await request.text()
      } catch {}
    }

    const response = await fetch(url.toString(), {
      method: request.method,
      headers,
      body,
    })

    if (!response.ok) {
      console.error(`Proxy error: ${response.status} ${response.statusText} for ${url.toString()}`)
    }

    const contentType = response.headers.get('content-type') || 'text/html'
    const responseBody = contentType.includes('application/json') || contentType.includes('text/')
      ? await response.text()
      : await response.arrayBuffer()

    const responseHeaders = new Headers()
    const skipResponseHeaders = ['content-encoding', 'transfer-encoding', 'connection']

    response.headers.forEach((value, key) => {
      if (!skipResponseHeaders.includes(key.toLowerCase())) {
        responseHeaders.set(key, value)
      }
    })

    return new NextResponse(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    })
  } catch (error) {
    console.error(`Error proxying to ${targetUrl}${pathname}:`, error)
    return NextResponse.json(
      {
        error: 'Service unavailable',
        message: `Error connecting to service at ${targetUrl}`,
      },
      { status: 502 }
    )
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/shopflow')) {
    if (process.env.NEXT_PUBLIC_SHOPFLOW_ENABLED === 'false') {
      return NextResponse.json({ error: 'ShopFlow module is disabled' }, { status: 404 })
    }

    const shopflowUrl = process.env.NEXT_PUBLIC_SHOPFLOW_URL || 'http://shopflow-frontend:3003'

    // Handle Next.js image optimization routes
    if (pathname.includes('_next/image')) {
      const imageUrl = request.nextUrl.searchParams.get('url')
      if (imageUrl) {
        const imagePath = '/shopflow' + decodeURIComponent(imageUrl)
        return proxyRequest(request, shopflowUrl, imagePath)
      }
    }

    return proxyRequest(request, shopflowUrl, pathname)
  }

  if (pathname.startsWith('/workify')) {
    if (process.env.NEXT_PUBLIC_WORKIFY_ENABLED === 'false') {
      return NextResponse.json({ error: 'Workify module is disabled' }, { status: 404 })
    }

    const workifyUrl = process.env.NEXT_PUBLIC_WORKIFY_URL || 'http://workify-frontend:3004'
    const targetPath = pathname.replace(/^\/workify/, '') || '/'
    return proxyRequest(request, workifyUrl, targetPath)
  }

  // Skip static assets for the hub itself
  if (pathname.startsWith('/_next/') ||
      pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot|css|js|json)$/i)) {
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/shopflow/:path*', '/workify/:path*'],
}
