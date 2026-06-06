import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const EXPEDIENTE_DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

const { readFileMock, actaHandlerMock, ordenTrabajoHandlerMock, getSessionUserIdMock, serverBaroGetDataMock } =
  vi.hoisted(() => ({
    readFileMock: vi.fn(),
    actaHandlerMock: vi.fn(),
    ordenTrabajoHandlerMock: vi.fn(),
    getSessionUserIdMock: vi.fn(),
    serverBaroGetDataMock: vi.fn(),
  }))

vi.mock('node:fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs/promises')>()
  return {
    ...actual,
    readFile: (...args: unknown[]) => readFileMock(...args),
    stat: vi.fn().mockResolvedValue({ mtimeMs: 1 }),
  }
})

vi.mock('@/lib/expediente/docx/renderer-registry', () => ({
  DYNAMIC_RENDERERS: {
    acta: (id: string, userId: string, ctx?: unknown) => actaHandlerMock(id, userId, ctx),
    'orden-trabajo': (id: string, userId: string, ctx?: unknown) =>
      ordenTrabajoHandlerMock(id, userId, ctx),
  },
}))

vi.mock('@/lib/expediente/descarga', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/expediente/descarga')>()
  return {
    ...actual,
    withExpedienteDocxPreviewDisposition: (res: NextResponse) => res,
    withExpedienteDocxPreviewCacheHeaders: (res: NextResponse) => res,
  }
})

vi.mock('@/lib/auth/session', () => ({
  getSessionUserId: () => getSessionUserIdMock(),
}))

vi.mock('@/lib/api/server', () => ({
  serverBaroGetData: (...args: unknown[]) => serverBaroGetDataMock(...args),
}))

let GET: typeof import('@/app/(protected)/expedientes/[id]/descargar/[tipo]/route').GET

beforeAll(async () => {
  ;({ GET } = await import('@/app/(protected)/expedientes/[id]/descargar/[tipo]/route'))
})

function buildRequest(query: Record<string, string> = {}): NextRequest {
  const searchParams = new URLSearchParams(query)
  return {
    nextUrl: { searchParams },
    headers: {
      get() {
        return null
      },
    },
  } as unknown as NextRequest
}

describe('GET /expedientes/[id]/descargar/[tipo]', () => {
  beforeEach(() => {
    actaHandlerMock.mockReset()
    ordenTrabajoHandlerMock.mockReset()
  })

  afterEach(() => {
    readFileMock.mockReset()
    getSessionUserIdMock.mockReset()
    serverBaroGetDataMock.mockReset()
  })

  it('responde 404 sin sesión (sin filtrar existencia del expediente)', async () => {
    getSessionUserIdMock.mockResolvedValue(null)
    const res = await GET(buildRequest(), {
      params: Promise.resolve({ id: 'm-1', tipo: 'acta' }),
    })
    expect(res.status).toBe(404)
  })

  it('sirve bytes .docx con MIME Word cuando el titular coincide y format=docx', async () => {
    getSessionUserIdMock.mockResolvedValue('user-1')
    serverBaroGetDataMock.mockResolvedValue({
      id: 'm-1',
      nomenclaturaCatastral: '18-88/418288',
      updatedAt: '2026-01-01T00:00:00.000Z',
    })
    actaHandlerMock.mockResolvedValue(
      new NextResponse(new Uint8Array(Buffer.from('PK\x03\x04fake-docx')), {
        status: 200,
        headers: {
          'Content-Type': EXPEDIENTE_DOCX_MIME,
          'Content-Disposition': 'attachment; filename="ActaExpediente_18-88_418288.docx"',
        },
      })
    )

    const res = await GET(buildRequest({ format: 'docx' }), {
      params: Promise.resolve({ id: 'm-1', tipo: 'acta' }),
    })

    expect(actaHandlerMock).toHaveBeenCalledWith('m-1', 'user-1', expect.anything())
    expect(readFileMock).not.toHaveBeenCalled()
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toBe(EXPEDIENTE_DOCX_MIME)
  })

  it('responde 404 si el expediente no pertenece al usuario', async () => {
    getSessionUserIdMock.mockResolvedValue('user-1')
    serverBaroGetDataMock.mockResolvedValue(null)

    const res = await GET(buildRequest({ format: 'docx' }), {
      params: Promise.resolve({ id: 'm-ajeno', tipo: 'acta' }),
    })
    expect(res.status).toBe(404)
    expect(actaHandlerMock).not.toHaveBeenCalled()
  })

  it('orden-trabajo responde 422 si falta la fecha de orden de trabajo', async () => {
    getSessionUserIdMock.mockResolvedValue('user-1')
    serverBaroGetDataMock.mockResolvedValue({
      id: 'm-1',
      nomenclaturaCatastral: '18-88/418288',
      updatedAt: '2026-01-01T00:00:00.000Z',
    })
    ordenTrabajoHandlerMock.mockResolvedValue(
      new NextResponse(JSON.stringify({ code: 'datos_faltantes' }), {
        status: 422,
        headers: { 'Content-Type': 'application/json' },
      })
    )

    const res = await GET(buildRequest({ format: 'docx' }), {
      params: Promise.resolve({ id: 'm-1', tipo: 'orden-trabajo' }),
    })
    expect(res.status).toBe(422)
    expect(readFileMock).not.toHaveBeenCalled()
  })
})
