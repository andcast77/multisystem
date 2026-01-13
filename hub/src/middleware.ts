import { NextRequest, NextResponse } from 'next/server'

async function proxyRequest(
  request: NextRequest,
  targetUrl: string,
  pathname: string
): Promise<NextResponse> {
  try {
    // Construir URL completa
    const url = new URL(pathname, targetUrl)
    
    // Copiar query parameters
    request.nextUrl.searchParams.forEach((value, key) => {
      url.searchParams.set(key, value)
    })
    
    // Preparar headers
    const headers = new Headers()
    const skipHeaders = ['host', 'connection', 'upgrade', 'keep-alive', 'transfer-encoding']
    
    request.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase()
      if (!skipHeaders.includes(lowerKey)) {
        headers.set(key, value)
      }
    })
    
    // Establecer host correcto
    const targetHost = new URL(targetUrl).host
    headers.set('host', targetHost)
    headers.set('x-forwarded-host', request.headers.get('host') || '')
    headers.set('x-forwarded-proto', request.nextUrl.protocol.slice(0, -1))
    headers.set('x-forwarded-for', request.ip || '')
    
    // Preparar body para métodos que lo requieren
    let body: string | undefined
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      try {
        body = await request.text()
      } catch {
        // Si no hay body, continuar sin él
      }
    }
    
    // Hacer la petición
    const response = await fetch(url.toString(), {
      method: request.method,
      headers: headers,
      body: body,
    })
    
    // Leer el body según el tipo de contenido
    let responseBody: string | ArrayBuffer
    const contentType = response.headers.get('content-type') || 'text/html'
    
    if (contentType.includes('application/json') || contentType.includes('text/')) {
      responseBody = await response.text()
    } else {
      responseBody = await response.arrayBuffer()
    }
    
    // Preparar headers de respuesta
    const responseHeaders = new Headers()
    const skipResponseHeaders = [
      'content-encoding',
      'transfer-encoding',
      'content-length',
      'connection',
    ]
    
    response.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase()
      if (!skipResponseHeaders.includes(lowerKey)) {
        responseHeaders.set(key, value)
      }
    })
    
    // Crear respuesta
    return new NextResponse(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    })
  } catch (error) {
    console.error(`Error proxying to ${targetUrl}:`, error)
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
  
  // Proxy para ShopFlow
  if (pathname.startsWith('/shopflow')) {
    // Verificar si está habilitado
    if (process.env.NEXT_PUBLIC_SHOPFLOW_ENABLED === 'false') {
      return NextResponse.json(
        { error: 'ShopFlow module is disabled' },
        { status: 404 }
      )
    }
    
    const shopflowUrl = process.env.NEXT_PUBLIC_SHOPFLOW_URL || 'http://shopflow-frontend:3003'
    // Mantener el path completo porque shopflow tiene basePath: '/shopflow'
    return proxyRequest(request, shopflowUrl, pathname)
  }

  // Proxy para Workify
  if (pathname.startsWith('/workify')) {
    // Verificar si está habilitado
    if (process.env.NEXT_PUBLIC_WORKIFY_ENABLED === 'false') {
      return NextResponse.json(
        { error: 'Workify module is disabled' },
        { status: 404 }
      )
    }
    
    const workifyUrl = process.env.NEXT_PUBLIC_WORKIFY_URL || 'http://workify-frontend:3004'
    // Remover el prefijo /workify porque workify no tiene basePath
    const targetPath = pathname.replace(/^\/workify/, '') || '/'
    return proxyRequest(request, workifyUrl, targetPath)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Capturar todas las rutas que empiecen con /shopflow o /workify
    // Excluir assets estáticos de Next.js
    '/shopflow/:path*',
    '/workify/:path*',
  ],
}
