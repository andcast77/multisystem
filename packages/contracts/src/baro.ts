export type BaroExpedienteStatus = 'DRAFT'

export type BaroProfessionalTitle = 'AGRIMENSOR' | 'INGENIERO_AGRIMENSOR'
export type BaroTitleGrammarGender = 'MASCULINO' | 'FEMENINO'

export type BaroProfessionalRegistrationDto = {
  id: string
  licenseNumber: string
  jurisdiction: string
  bodyName: string | null
  createdAt?: string
}

export type BaroProfessionalDto = {
  id: string
  companyId: string
  userId: string | null
  displayName: string
  professionalTitle: BaroProfessionalTitle
  titleGrammarGender?: BaroTitleGrammarGender
  dni: string
  sexo: string
  phone: string | null
  whatsapp: string | null
  professionalEmail: string | null
  addressLine1: string
  addressLine2: string | null
  locality: string
  province: string
  postalCode: string | null
  websiteUrl: string | null
  cuit: string | null
  active: boolean
  createdAt?: string
  updatedAt?: string
  registrations?: BaroProfessionalRegistrationDto[]
  primaryMatricula?: string | null
  primaryJurisdiction?: string | null
  isTitular?: boolean
}

export type BaroExpedienteDto = {
  id: string
  companyId: string
  status: BaroExpedienteStatus
  objetoExpedienteId: string
  nomenclaturaCatastral: string
  propietario: string
  principalProfessionalId: string
  secondProfessionalId: string | null
  principalProfessionalName?: string
  domicilioParcela?: string | null
  createdAt: string
  updatedAt: string
}

export type BaroExpedienteActuanteDto = {
  professionalId: string
  orden: number
}

export type BaroExpedienteColindanteNomenclaturaDto = {
  id: string
  orden: number
  nomenclatura: string
  rumbo: string
}

export type BaroExpedienteColindanteDto = {
  id: string
  orden: number
  distancia: string
  colindante: string
  descripcion: string | null
  notificaA: string
  domicilioParcelaColindante: string
  domicilioTitularColindante: string
  dirigidoA: string
  nomenclaturas: BaroExpedienteColindanteNomenclaturaDto[]
}

export type BaroExpedienteOrdenanteDto = {
  id: string
  orden: number
  nombre: string
  documento: string
  sexo: string
  cuit: string
  domicilio: string
  caracter: string
  esPropietario: boolean
}

export type BaroExpedienteLinderoPuntoDto = {
  id: string
  orden: number
  tipo: string
  direccion: string
  descripcion: string
  medida: string
}

export type BaroExpedienteLinderosDto = {
  id: string
  superficieTotal: string
  superficieSegun: string
  fechaRelacionTitulos: string
  observacionesGenerales: string
  puntos: BaroExpedienteLinderoPuntoDto[]
}

export type BaroExpedienteTituloRelacionDto = {
  id: string
  orden: number
  instrumento: string
  matricula: string
  fechaTitulo: string
  observaciones: string | null
}

export type BaroExpedienteDetailDto = BaroExpedienteDto & {
  planoAntecedente: string | null
  loteFraccion: string | null
  domicilioParcela: string | null
  parcial: boolean
  soloOrdenTrabajo: boolean
  fechaOrdenTrabajo: string | null
  domicilioPropietario: string | null
  inscripcionDominio: string | null
  naturalezaActo: string | null
  memoriaObservaciones: string | null
  motivoHidraulica: string | null
  motivoFiscalia: string | null
  municipio: string | null
  requiereVisacionMunicipal: boolean
  publicacionEdictoFecha: string | null
  publicacionEdictoNumero: string | null
  boletinOficialNota: string | null
  actaNotarialNumero: string | null
  actaNotarialFecha: string | null
  publicacionActaObservaciones: string | null
  lugarReunion: string | null
  toleranciaActa: string | null
  llevPublicacionEdictos: boolean
  medioPublicacion: string | null
  actuantes: BaroExpedienteActuanteDto[]
  colindantes: BaroExpedienteColindanteDto[]
  ordenantes: BaroExpedienteOrdenanteDto[]
  linderos: BaroExpedienteLinderosDto | null
  tituloRelaciones: BaroExpedienteTituloRelacionDto[]
  titularProfessionalId: string | null
}

export type BaroMeProfileSummary = {
  displayName: string
  professionalTitle: BaroProfessionalTitle
  titleGrammarGender: BaroTitleGrammarGender
  titularProfessionalId: string
}

export type BaroMeResponse = {
  user: {
    id: string
    email: string
    emailVerified: string | null
  }
  profile: BaroMeProfileSummary | null
}

export type CreateBaroExpedienteInput = {
  objetoExpedienteId: string
  nomenclaturaCatastral: string
  propietario: string
  principalProfessionalId: string
  secondProfessionalId?: string
  actuantesIds?: string[]
  fechaOrdenTrabajo?: string | null
  planoAntecedente?: string | null
  loteFraccion?: string | null
  domicilioParcela?: string | null
  parcial?: boolean
  soloOrdenTrabajo?: boolean
  domicilioPropietario?: string | null
  inscripcionDominio?: string | null
  naturalezaActo?: string | null
  memoriaObservaciones?: string | null
  motivoHidraulica?: string | null
  motivoFiscalia?: string | null
  municipio?: string | null
  requiereVisacionMunicipal?: boolean
  ordenantes?: Array<{
    nombre: string
    documento: string
    sexo: string
    cuit: string
    domicilio: string
    caracter: string
    esPropietario: boolean
  }>
}

export type UpdateBaroExpedienteFullInput = {
  datos: Record<string, unknown>
  publicacion: Record<string, unknown>
  colindantes: Array<Record<string, unknown>>
  titulos: Array<Record<string, unknown>>
  ordenantes: Array<Record<string, unknown>>
  linderos: Record<string, unknown>
}
