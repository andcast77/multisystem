import { describe, expect, it, vi, beforeEach } from 'vitest'
import { updateExpedienteFull } from '@/lib/expediente/actions/update-all'
import type { DatosFields, PublicacionFields } from '@/stores/expediente-store'

const getSessionUserIdMock = vi.fn()
const serverBaroPutMock = vi.fn()
const revalidatePathMock = vi.fn()

vi.mock('next/cache', () => ({
  revalidatePath: (...args: unknown[]) => revalidatePathMock(...args),
}))

vi.mock('@/lib/auth/session', () => ({
  getSessionUserId: () => getSessionUserIdMock(),
}))

vi.mock('@/lib/api/server', () => ({
  serverBaroPut: (...args: unknown[]) => serverBaroPutMock(...args),
}))

const validDatos: DatosFields = {
  actuantesIds: ['prof-1'],
  objetoExpedienteId: 'cabida_unica',
  nomenclaturaCatastral: '18-88/001',
  nomenclaturaAnulada: false,
  planoAntecedente: '',
  loteFraccion: '',
  domicilioParcela: '',
  parcial: false,
  soloOrdenTrabajo: false,
  fechaOrdenTrabajo: '',
  propietario: 'Propietario Fixture',
  domicilioPropietario: '',
  inscripcionDominio: '',
  naturalezaActo: '',
  memoriaObservaciones: '',
  motivoHidraulica: '',
  motivoFiscalia: '',
  municipio: '',
  requiereVisacionMunicipal: false,
}

const validPublicacion: PublicacionFields = {
  publicacionEdictoFecha: '',
  publicacionEdictoNumero: '',
  boletinOficialNota: '',
  actaNotarialNumero: '',
  actaNotarialFecha: '',
  publicacionActaObservaciones: '',
  lugarReunion: 'Sala B',
  toleranciaActa: '30 Minutos',
  llevPublicacionEdictos: false,
  medioPublicacion: '',
}

function buildInput(overrides: Record<string, unknown> = {}) {
  return {
    expedienteId: 'm1',
    datos: validDatos,
    publicacion: validPublicacion,
    colindantes: [],
    titulos: [],
    ordenantes: [],
    linderos: {
      id: null,
      superficieTotal: '',
      superficieSegun: '',
      fechaRelacionTitulos: '',
      observacionesGenerales: '',
      puntos: [],
    },
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  getSessionUserIdMock.mockResolvedValue('user-1')
  serverBaroPutMock.mockResolvedValue({ success: true, message: 'Expediente guardado correctamente.' })
})

describe('updateExpedienteFull — API delegation', () => {
  it('devuelve error cuando el usuario no está autenticado', async () => {
    getSessionUserIdMock.mockResolvedValue(null)
    const r = await updateExpedienteFull(buildInput())
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.message).toMatch(/autenticad/i)
    expect(serverBaroPutMock).not.toHaveBeenCalled()
  })

  it('delega PUT /expedientes/:id/full con el payload completo', async () => {
    const input = buildInput()
    const r = await updateExpedienteFull(input)
    expect(r.ok).toBe(true)
    expect(serverBaroPutMock).toHaveBeenCalledWith('/expedientes/m1/full', {
      datos: input.datos,
      publicacion: input.publicacion,
      colindantes: input.colindantes,
      titulos: input.titulos,
      ordenantes: input.ordenantes,
      linderos: input.linderos,
    })
    expect(revalidatePathMock).toHaveBeenCalledWith('/expedientes/m1')
  })

  it('propaga error cuando la API responde success: false', async () => {
    serverBaroPutMock.mockResolvedValue({ success: false, message: 'Expediente no encontrado.' })
    const r = await updateExpedienteFull(buildInput())
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.message).toMatch(/no encontr/i)
  })

  it('devuelve error genérico ante excepción de red', async () => {
    serverBaroPutMock.mockRejectedValue(new Error('network'))
    const r = await updateExpedienteFull(buildInput())
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.message).toMatch(/guardar/i)
  })
})
