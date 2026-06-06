import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }) }))
import {
  ExpedienteDatosGeneralesForm,
  type ExpedienteDatosSnapshot,
} from '@/components/app/expedientes/expediente-datos-generales-form'
import { ExpedienteProvider } from '@/stores/expediente-store'
import type { ProfessionalForForm } from '@/components/app/expedientes/expediente-datos-generales-form'
import { TooltipProvider } from '@/components/ui/tooltip'

const TITULAR_ID = 'cmdevtitularprofessionalseed01'

const initial: ExpedienteDatosSnapshot = {
  id: 'expediente-exp-99',
  actuantesProfessionalIds: [TITULAR_ID],
  objetoExpedienteId: 'cabida_unica',
  nomenclaturaCatastral: '99-99/999999',
  nomenclaturaAnulada: true,
  planoAntecedente: 'P-1',
  loteFraccion: 'Lote A',
  domicilioParcela: 'Calle 1',
  parcial: true,
  soloOrdenTrabajo: false,
  fechaOrdenTrabajo: null,
  propietario: 'Dueño Test',
  domicilioPropietario: 'Dom prop',
  inscripcionDominio: 'Ins 1',
  naturalezaActo: 'Nat',
  memoriaObservaciones: 'Memo',
  motivoHidraulica: 'H',
  motivoFiscalia: 'F',
  municipio: 'Capital',
  requiereVisacionMunicipal: true,
}

const mockProfessionals: ProfessionalForForm[] = [
  {
    id: TITULAR_ID,
    displayName: 'Prof Titular',
    professionalTitle: 'AGRIMENSOR',
    titleGrammarGender: 'MASCULINO',
    locality: '',
    phone: null,
    professionalEmail: null,
    primaryMatricula: null,
    primaryJurisdiction: null,
    isTitular: true,
    active: true,
  },
]

const emptyLinderos = {
  id: null,
  superficieTotal: '',
  superficieSegun: '',
  fechaRelacionTitulos: '',
  observacionesGenerales: '',
  puntos: [],
}

function renderWithStore(
  overrides: Partial<ExpedienteDatosSnapshot> = {},
  professionals: ProfessionalForForm[] = mockProfessionals
) {
  const snap = { ...initial, ...overrides }
  return render(
    <TooltipProvider>
      <ExpedienteProvider
      initial={{
        expedienteId: snap.id,
        datos: {
          actuantesIds: [...snap.actuantesProfessionalIds],
          objetoExpedienteId: snap.objetoExpedienteId,
          nomenclaturaCatastral: snap.nomenclaturaCatastral,
          nomenclaturaAnulada: snap.nomenclaturaAnulada,
          planoAntecedente: snap.planoAntecedente ?? '',
          loteFraccion: snap.loteFraccion ?? '',
          domicilioParcela: snap.domicilioParcela ?? '',
          parcial: snap.parcial,
          soloOrdenTrabajo: snap.soloOrdenTrabajo,
          fechaOrdenTrabajo: snap.fechaOrdenTrabajo ?? '',
          propietario: snap.propietario,
          domicilioPropietario: snap.domicilioPropietario ?? '',
          inscripcionDominio: snap.inscripcionDominio ?? '',
          naturalezaActo: snap.naturalezaActo ?? '',
          memoriaObservaciones: snap.memoriaObservaciones ?? '',
          motivoHidraulica: snap.motivoHidraulica ?? '',
          motivoFiscalia: snap.motivoFiscalia ?? '',
          municipio: snap.municipio ?? '',
          requiereVisacionMunicipal: snap.requiereVisacionMunicipal,
        },
        publicacion: {
          publicacionEdictoFecha: '',
          publicacionEdictoNumero: '',
          boletinOficialNota: '',
          actaNotarialNumero: '',
          actaNotarialFecha: '',
          publicacionActaObservaciones: '',
          lugarReunion: '',
          toleranciaActa: '',
          llevPublicacionEdictos: false,
          medioPublicacion: '',
        },
        colindantes: [],
        titulos: [],
        ordenantes: [],
        linderos: emptyLinderos,
      }}
    >
      <ExpedienteDatosGeneralesForm professionals={professionals} />
    </ExpedienteProvider>
    </TooltipProvider>
  )
}

describe('ExpedienteDatosGeneralesForm', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('muestra valores iniciales del expediente', () => {
    renderWithStore()
    expect(screen.getByDisplayValue('99-99/999999')).toBeInTheDocument()
    expect(screen.getByText('No hay propietarios cargados.')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /nomenclatura anulada/i })).toBeChecked()
  })
})
