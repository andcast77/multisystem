import { prisma } from '../db/index.js'
import type { CompanyContext } from '../core/auth-context.js'
import type {
  CreateBaroExpedienteBody,
  BaroExpedienteResponse,
  BaroProfessionalResponse,
  BaroMeResponse,
  BaroProfessionalUpsertBody,
  UpdateBaroExpedienteFullBody,
} from '../dto/baro.dto.js'

type BaroProfessionalTitle = 'AGRIMENSOR' | 'INGENIERO_AGRIMENSOR'

const registrationOrderBy = [{ jurisdiction: 'asc' as const }, { licenseNumber: 'asc' as const }]

function sexoToGrammarGender(sexo: string): 'MASCULINO' | 'FEMENINO' {
  const s = sexo.trim().toLowerCase()
  if (s === 'f' || s === 'femenino' || s === 'mujer') return 'FEMENINO'
  return 'MASCULINO'
}

function summarizeProfessionalTitles(
  title: BaroProfessionalTitle,
  sexo: string
): { professionalTitle: BaroProfessionalTitle; titleGrammarGender: 'MASCULINO' | 'FEMENINO' } {
  return { professionalTitle: title, titleGrammarGender: sexoToGrammarGender(sexo) }
}

function pickRepresentativeRegistration(
  registrations: Array<{ licenseNumber: string; jurisdiction: string; createdAt?: Date }>
) {
  const sj = registrations.filter((r) => r.jurisdiction.trim().toLowerCase() === 'san juan')
  const pool = sj.length > 0 ? sj : registrations
  if (pool.length === 0) return null
  return [...pool].sort((a, b) => {
    const ta = a.createdAt?.getTime() ?? 0
    const tb = b.createdAt?.getTime() ?? 0
    return ta - tb
  })[0]!
}

function optTrim(s: string | undefined | null): string | null {
  const t = s?.trim()
  return t && t.length > 0 ? t : null
}

function principalSecondFromActuantes(actuantesIds: string[]): {
  principalProfessionalId: string
  secondProfessionalId: string | null
} {
  const ids = actuantesIds.map((x) => x.trim()).filter(Boolean)
  return {
    principalProfessionalId: ids[0] ?? '',
    secondProfessionalId: ids.length >= 2 ? ids[1]! : null,
  }
}

function principalSecondForPersist(
  actuantesOrdered: string[],
  existing: { principalProfessionalId: string; secondProfessionalId: string | null } | null
): { principalProfessionalId: string; secondProfessionalId: string | null } {
  if (actuantesOrdered.length > 0) return principalSecondFromActuantes(actuantesOrdered)
  if (existing) {
    return {
      principalProfessionalId: existing.principalProfessionalId,
      secondProfessionalId: existing.secondProfessionalId,
    }
  }
  return { principalProfessionalId: '', secondProfessionalId: null }
}

async function getTitularProfessional(ctx: CompanyContext) {
  return prisma.baroProfessional.findFirst({
    where: { companyId: ctx.companyId, userId: ctx.userId },
    include: { registrations: { orderBy: registrationOrderBy } },
  })
}

async function getTitularProfessionalId(ctx: CompanyContext): Promise<string | null> {
  const titular = await getTitularProfessional(ctx)
  return titular?.id ?? null
}

function mapProfessional(
  p: {
    id: string
    companyId: string
    userId: string | null
    displayName: string
    professionalTitle: BaroProfessionalTitle
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
    createdAt?: Date
    updatedAt?: Date
    registrations?: Array<{
      id: string
      licenseNumber: string
      jurisdiction: string
      bodyName: string | null
      createdAt?: Date
    }>
  },
  titularId: string | null
): BaroProfessionalResponse {
  const rep = p.registrations ? pickRepresentativeRegistration(p.registrations) : null
  const titles = summarizeProfessionalTitles(p.professionalTitle, p.sexo)
  return {
    id: p.id,
    companyId: p.companyId,
    userId: p.userId,
    displayName: p.displayName,
    professionalTitle: p.professionalTitle,
    titleGrammarGender: titles.titleGrammarGender,
    dni: p.dni,
    sexo: p.sexo,
    phone: p.phone,
    whatsapp: p.whatsapp,
    professionalEmail: p.professionalEmail,
    addressLine1: p.addressLine1,
    addressLine2: p.addressLine2,
    locality: p.locality,
    province: p.province,
    postalCode: p.postalCode,
    websiteUrl: p.websiteUrl,
    cuit: p.cuit,
    active: p.active,
    createdAt: p.createdAt?.toISOString(),
    updatedAt: p.updatedAt?.toISOString(),
    registrations: p.registrations?.map((r) => ({
      id: r.id,
      licenseNumber: r.licenseNumber,
      jurisdiction: r.jurisdiction,
      bodyName: r.bodyName,
      createdAt: r.createdAt?.toISOString(),
    })),
    primaryMatricula: rep?.licenseNumber ?? null,
    primaryJurisdiction: rep?.jurisdiction ?? null,
    isTitular: titularId != null && p.id === titularId,
  }
}

function toExpediente(e: {
  id: string
  companyId: string
  status: string
  objetoExpedienteId: string
  nomenclaturaCatastral: string
  propietario: string
  principalProfessionalId: string
  secondProfessionalId: string | null
  domicilioParcela?: string | null
  createdAt: Date
  updatedAt: Date
  principalProfessional?: { displayName: string }
}): BaroExpedienteResponse {
  return {
    id: e.id,
    companyId: e.companyId,
    status: e.status,
    objetoExpedienteId: e.objetoExpedienteId,
    nomenclaturaCatastral: e.nomenclaturaCatastral,
    propietario: e.propietario,
    principalProfessionalId: e.principalProfessionalId,
    secondProfessionalId: e.secondProfessionalId,
    principalProfessionalName: e.principalProfessional?.displayName,
    domicilioParcela: e.domicilioParcela,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  }
}

async function replaceExpedienteActuantes(
  tx: Pick<typeof prisma, 'baroExpedienteActuante'>,
  expedienteId: string,
  professionalIdsOrdered: string[]
): Promise<void> {
  await tx.baroExpedienteActuante.deleteMany({ where: { expedienteId } })
  if (professionalIdsOrdered.length === 0) return
  await tx.baroExpedienteActuante.createMany({
    data: professionalIdsOrdered.map((professionalId, orden) => ({
      expedienteId,
      professionalId,
      orden,
    })),
  })
}

async function assertProfessionalsInCompany(ctx: CompanyContext, ids: string[]): Promise<void> {
  if (ids.length === 0) return
  const rows = await prisma.baroProfessional.findMany({
    where: { companyId: ctx.companyId, id: { in: ids } },
    select: { id: true },
  })
  const allowed = new Set(rows.map((r) => r.id))
  const bad = ids.find((id) => !allowed.has(id))
  if (bad) throw new Error('Profesional no válido para la empresa')
}

export async function getMe(ctx: CompanyContext): Promise<BaroMeResponse> {
  const [user, titular] = await Promise.all([
    prisma.user.findUnique({
      where: { id: ctx.userId },
      select: { id: true, email: true, emailVerified: true },
    }),
    getTitularProfessional(ctx),
  ])

  if (!user) throw new Error('Usuario no encontrado')

  let profile: BaroMeResponse['profile'] = null
  if (titular) {
    const t = summarizeProfessionalTitles(titular.professionalTitle, titular.sexo)
    profile = {
      displayName: titular.displayName,
      professionalTitle: t.professionalTitle,
      titleGrammarGender: t.titleGrammarGender,
      titularProfessionalId: titular.id,
    }
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified ? new Date().toISOString() : null,
    },
    profile,
  }
}

export async function listProfessionals(ctx: CompanyContext): Promise<BaroProfessionalResponse[]> {
  const titularId = await getTitularProfessionalId(ctx)
  const rows = await prisma.baroProfessional.findMany({
    where: { companyId: ctx.companyId },
    orderBy: { displayName: 'asc' },
    include: { registrations: { orderBy: registrationOrderBy } },
  })
  return rows.map((p) => mapProfessional(p, titularId))
}

export async function listProfessionalsForForms(ctx: CompanyContext): Promise<BaroProfessionalResponse[]> {
  return listProfessionals(ctx)
}

export async function listCollaborators(ctx: CompanyContext): Promise<BaroProfessionalResponse[]> {
  const titularId = await getTitularProfessionalId(ctx)
  const rows = await prisma.baroProfessional.findMany({
    where: {
      companyId: ctx.companyId,
      ...(titularId ? { NOT: { id: titularId } } : {}),
    },
    orderBy: { displayName: 'asc' },
    include: { registrations: { orderBy: registrationOrderBy } },
  })
  return rows.map((p) => mapProfessional(p, titularId))
}

export async function getProfessionalById(ctx: CompanyContext, id: string): Promise<BaroProfessionalResponse | null> {
  const titularId = await getTitularProfessionalId(ctx)
  const row = await prisma.baroProfessional.findFirst({
    where: { id, companyId: ctx.companyId },
    include: { registrations: { orderBy: registrationOrderBy } },
  })
  return row ? mapProfessional(row, titularId) : null
}

export async function getTitularProfile(ctx: CompanyContext): Promise<BaroProfessionalResponse | null> {
  const titular = await getTitularProfessional(ctx)
  if (!titular) return null
  return mapProfessional(titular, titular.id)
}

export async function upsertTitularProfile(
  ctx: CompanyContext,
  body: BaroProfessionalUpsertBody
): Promise<BaroProfessionalResponse> {
  const titular = await getTitularProfessional(ctx)
  const registrationCreates = body.registrations.map((r) => ({
    licenseNumber: r.licenseNumber,
    jurisdiction: r.jurisdiction,
    bodyName: r.bodyName,
  }))

  const data = {
    professionalTitle: body.professionalTitle,
    displayName: body.displayName,
    dni: body.dni,
    sexo: body.sexo,
    phone: body.phone,
    whatsapp: body.whatsapp,
    professionalEmail: body.professionalEmail,
    addressLine1: body.addressLine1,
    addressLine2: body.addressLine2,
    locality: body.locality,
    province: body.province,
    postalCode: body.postalCode,
    websiteUrl: body.websiteUrl,
    cuit: body.cuit,
  }

  if (titular) {
    await prisma.baroProfessional.update({
      where: { id: titular.id },
      data: {
        ...data,
        registrations: { deleteMany: {}, create: registrationCreates },
      },
    })
    const saved = await getProfessionalById(ctx, titular.id)
    if (!saved) throw new Error('Perfil no encontrado')
    return saved
  }

  const created = await prisma.baroProfessional.create({
    data: {
      companyId: ctx.companyId,
      userId: ctx.userId,
      ...data,
      registrations: { create: registrationCreates },
    },
  })
  const saved = await getProfessionalById(ctx, created.id)
  if (!saved) throw new Error('Perfil no encontrado')
  return saved
}

export async function setTitularProfessional(ctx: CompanyContext, professionalId: string): Promise<void> {
  const pro = await prisma.baroProfessional.findFirst({
    where: { id: professionalId, companyId: ctx.companyId },
    select: { id: true },
  })
  if (!pro) throw new Error('Profesional no encontrado en la empresa')

  await prisma.$transaction([
    prisma.baroProfessional.updateMany({
      where: { companyId: ctx.companyId, userId: ctx.userId },
      data: { userId: null },
    }),
    prisma.baroProfessional.update({
      where: { id: professionalId },
      data: { userId: ctx.userId },
    }),
  ])
}

export async function createProfessional(
  ctx: CompanyContext,
  body: BaroProfessionalUpsertBody
): Promise<BaroProfessionalResponse> {
  const registrationCreates = body.registrations.map((r) => ({
    licenseNumber: r.licenseNumber,
    jurisdiction: r.jurisdiction,
    bodyName: r.bodyName,
  }))

  const created = await prisma.$transaction(async (tx) => {
    const professional = await tx.baroProfessional.create({
      data: {
        companyId: ctx.companyId,
        professionalTitle: body.professionalTitle,
        displayName: body.displayName,
        dni: body.dni,
        sexo: body.sexo,
        phone: body.phone,
        whatsapp: body.whatsapp,
        professionalEmail: body.professionalEmail,
        addressLine1: body.addressLine1,
        addressLine2: body.addressLine2,
        locality: body.locality,
        province: body.province,
        postalCode: body.postalCode,
        websiteUrl: body.websiteUrl,
        cuit: body.cuit,
        registrations: { create: registrationCreates },
      },
    })

    const titular = await tx.baroProfessional.findFirst({
      where: { companyId: ctx.companyId, userId: ctx.userId },
      select: { id: true },
    })
    if (!titular) {
      await tx.baroProfessional.update({
        where: { id: professional.id },
        data: { userId: ctx.userId },
      })
    }
    return professional
  })

  const saved = await getProfessionalById(ctx, created.id)
  if (!saved) throw new Error('Profesional no encontrado')
  return saved
}

export async function updateProfessional(
  ctx: CompanyContext,
  id: string,
  body: BaroProfessionalUpsertBody
): Promise<BaroProfessionalResponse> {
  const existing = await prisma.baroProfessional.findFirst({
    where: { id, companyId: ctx.companyId },
    select: { id: true },
  })
  if (!existing) throw new Error('Profesional no encontrado')

  const registrationCreates = body.registrations.map((r) => ({
    licenseNumber: r.licenseNumber,
    jurisdiction: r.jurisdiction,
    bodyName: r.bodyName,
  }))

  await prisma.baroProfessional.update({
    where: { id },
    data: {
      professionalTitle: body.professionalTitle,
      displayName: body.displayName,
      dni: body.dni,
      sexo: body.sexo,
      phone: body.phone,
      whatsapp: body.whatsapp,
      professionalEmail: body.professionalEmail,
      addressLine1: body.addressLine1,
      addressLine2: body.addressLine2,
      locality: body.locality,
      province: body.province,
      postalCode: body.postalCode,
      websiteUrl: body.websiteUrl,
      cuit: body.cuit,
      ...(body.active !== undefined ? { active: body.active } : {}),
      registrations: { deleteMany: {}, create: registrationCreates },
    },
  })

  const saved = await getProfessionalById(ctx, id)
  if (!saved) throw new Error('Profesional no encontrado')
  return saved
}

export async function setProfessionalActive(
  ctx: CompanyContext,
  id: string,
  active: boolean
): Promise<BaroProfessionalResponse> {
  const existing = await prisma.baroProfessional.findFirst({
    where: { id, companyId: ctx.companyId },
    select: { id: true },
  })
  if (!existing) throw new Error('Profesional no encontrado')

  await prisma.baroProfessional.update({ where: { id }, data: { active } })
  const saved = await getProfessionalById(ctx, id)
  if (!saved) throw new Error('Profesional no encontrado')
  return saved
}

export async function deleteProfessional(ctx: CompanyContext, id: string): Promise<void> {
  const existing = await prisma.baroProfessional.findFirst({
    where: { id, companyId: ctx.companyId },
    select: { id: true },
  })
  if (!existing) throw new Error('Profesional no encontrado')

  const expedientesCount = await prisma.baroExpediente.count({
    where: {
      companyId: ctx.companyId,
      OR: [
        { principalProfessionalId: id },
        { secondProfessionalId: id },
        { actuantes: { some: { professionalId: id } } },
      ],
    },
  })
  if (expedientesCount > 0) {
    throw new Error(`Tiene ${expedientesCount} expediente(s) asociado(s)`)
  }

  await prisma.baroProfessional.delete({ where: { id } })
}

export async function listExpedientes(ctx: CompanyContext): Promise<BaroExpedienteResponse[]> {
  const rows = await prisma.baroExpediente.findMany({
    where: { companyId: ctx.companyId },
    orderBy: { updatedAt: 'desc' },
    include: { principalProfessional: { select: { displayName: true } } },
  })
  return rows.map(toExpediente)
}

export async function getExpedienteById(ctx: CompanyContext, id: string): Promise<BaroExpedienteResponse | null> {
  const row = await prisma.baroExpediente.findFirst({
    where: { id, companyId: ctx.companyId },
    include: { principalProfessional: { select: { displayName: true } } },
  })
  return row ? toExpediente(row) : null
}

export async function getExpedienteDetail(ctx: CompanyContext, id: string) {
  const titularId = await getTitularProfessionalId(ctx)
  const row = await prisma.baroExpediente.findFirst({
    where: { id, companyId: ctx.companyId },
    include: {
      actuantes: { orderBy: { orden: 'asc' }, select: { professionalId: true, orden: true } },
      colindantes: {
        orderBy: { orden: 'asc' },
        include: { nomenclaturas: { orderBy: { orden: 'asc' } } },
      },
      ordenantes: { orderBy: { orden: 'asc' } },
      linderos: { include: { puntos: { orderBy: { orden: 'asc' } } } },
      tituloRelaciones: { orderBy: { orden: 'asc' } },
      principalProfessional: { select: { displayName: true } },
    },
  })
  if (!row) return null

  return {
    ...toExpediente(row),
    planoAntecedente: row.planoAntecedente,
    loteFraccion: row.loteFraccion,
    domicilioParcela: row.domicilioParcela,
    parcial: row.parcial,
    soloOrdenTrabajo: row.soloOrdenTrabajo,
    fechaOrdenTrabajo: row.fechaOrdenTrabajo,
    domicilioPropietario: row.domicilioPropietario,
    inscripcionDominio: row.inscripcionDominio,
    naturalezaActo: row.naturalezaActo,
    memoriaObservaciones: row.memoriaObservaciones,
    motivoHidraulica: row.motivoHidraulica,
    motivoFiscalia: row.motivoFiscalia,
    municipio: row.municipio,
    requiereVisacionMunicipal: row.requiereVisacionMunicipal,
    nomenclaturaAnulada: row.nomenclaturaAnulada,
    publicacionEdictoFecha: row.publicacionEdictoFecha,
    publicacionEdictoNumero: row.publicacionEdictoNumero,
    boletinOficialNota: row.boletinOficialNota,
    actaNotarialNumero: row.actaNotarialNumero,
    actaNotarialFecha: row.actaNotarialFecha,
    publicacionActaObservaciones: row.publicacionActaObservaciones,
    lugarReunion: row.lugarReunion,
    toleranciaActa: row.toleranciaActa,
    llevPublicacionEdictos: row.llevPublicacionEdictos,
    medioPublicacion: row.medioPublicacion,
    actuantes: row.actuantes.map((a) => ({ professionalId: a.professionalId, orden: a.orden })),
    colindantes: row.colindantes.map((c) => ({
      id: c.id,
      orden: c.orden,
      distancia: c.distancia,
      colindante: c.colindante,
      descripcion: c.descripcion,
      notificaA: c.notificaA,
      domicilioParcelaColindante: c.domicilioParcelaColindante,
      domicilioTitularColindante: c.domicilioTitularColindante,
      dirigidoA: c.dirigidoA,
      nomenclaturas: c.nomenclaturas.map((n) => ({
        id: n.id,
        orden: n.orden,
        nomenclatura: n.nomenclatura,
        rumbo: n.rumbo,
      })),
    })),
    ordenantes: row.ordenantes.map((o) => ({
      id: o.id,
      orden: o.orden,
      nombre: o.nombre,
      documento: o.documento,
      sexo: o.sexo,
      cuit: o.cuit,
      domicilio: o.domicilio,
      caracter: o.caracter,
      esPropietario: o.esPropietario,
    })),
    linderos: row.linderos
      ? {
          id: row.linderos.id,
          superficieTotal: row.linderos.superficieTotal,
          superficieSegun: row.linderos.superficieSegun,
          fechaRelacionTitulos: row.linderos.fechaRelacionTitulos,
          observacionesGenerales: row.linderos.observacionesGenerales,
          puntos: row.linderos.puntos.map((p) => ({
            id: p.id,
            orden: p.orden,
            tipo: p.tipo,
            direccion: p.direccion,
            descripcion: p.descripcion,
            medida: p.medida,
          })),
        }
      : null,
    tituloRelaciones: row.tituloRelaciones.map((t) => ({
      id: t.id,
      orden: t.orden,
      instrumento: t.instrumento,
      matricula: t.matricula,
      fechaTitulo: t.fechaTitulo,
      observaciones: t.observaciones,
    })),
    titularProfessionalId: titularId,
  }
}

const docxIncludeByType: Record<string, object> = {
  'orden-trabajo': {
    ordenantes: { orderBy: { orden: 'asc' } },
    principalProfessional: { include: { registrations: { orderBy: { createdAt: 'asc' } } } },
    secondProfessional: { include: { registrations: { orderBy: { createdAt: 'asc' } } } },
  },
  citacion: {
    colindantes: {
      orderBy: { orden: 'asc' },
      include: { nomenclaturas: { orderBy: { orden: 'asc' } } },
    },
    principalProfessional: { include: { registrations: { orderBy: { createdAt: 'asc' } } } },
    secondProfessional: { include: { registrations: { orderBy: { createdAt: 'asc' } } } },
  },
  edicto: {
    colindantes: {
      orderBy: { orden: 'asc' },
      include: { nomenclaturas: { orderBy: { orden: 'asc' } } },
    },
    principalProfessional: { include: { registrations: { orderBy: { createdAt: 'asc' } } } },
    secondProfessional: { include: { registrations: { orderBy: { createdAt: 'asc' } } } },
  },
  acta: {
    ordenantes: { orderBy: { orden: 'asc' } },
    principalProfessional: { include: { registrations: { orderBy: { createdAt: 'asc' } } } },
    secondProfessional: { include: { registrations: { orderBy: { createdAt: 'asc' } } } },
  },
  'relacion-titulo': {
    principalProfessional: { include: { registrations: { orderBy: { createdAt: 'asc' } } } },
    secondProfessional: { include: { registrations: { orderBy: { createdAt: 'asc' } } } },
    linderos: { include: { puntos: { orderBy: { orden: 'asc' } } } },
  },
  'memoria-descriptiva': {
    colindantes: {
      orderBy: { orden: 'asc' },
      include: { nomenclaturas: { orderBy: { orden: 'asc' } } },
    },
    ordenantes: { orderBy: { orden: 'asc' } },
    principalProfessional: { include: { registrations: { orderBy: { createdAt: 'asc' } } } },
    secondProfessional: { include: { registrations: { orderBy: { createdAt: 'asc' } } } },
  },
  'nota-hidraulica': {
    principalProfessional: { include: { registrations: { orderBy: { createdAt: 'asc' } } } },
  },
  'nota-fiscalia': {
    principalProfessional: { include: { registrations: { orderBy: { createdAt: 'asc' } } } },
  },
}

function serializeDates<T>(value: T): T {
  if (value instanceof Date) return value.toISOString() as T
  if (Array.isArray(value)) return value.map(serializeDates) as T
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value)) out[k] = serializeDates(v)
    return out as T
  }
  return value
}

export async function getExpedienteDocxData(ctx: CompanyContext, id: string, docType: string) {
  const include = docxIncludeByType[docType]
  if (!include) return null

  const row = await prisma.baroExpediente.findFirst({
    where: { id, companyId: ctx.companyId },
    include,
  })
  if (!row) return null
  return serializeDates(row)
}

export async function createExpediente(
  ctx: CompanyContext,
  body: CreateBaroExpedienteBody
): Promise<BaroExpedienteResponse> {
  const actuantesOrdered = (body.actuantesIds ?? []).map((x) => x.trim()).filter(Boolean)
  if (actuantesOrdered.length > 0) {
    await assertProfessionalsInCompany(ctx, actuantesOrdered)
  }

  let principalProfessionalId = body.principalProfessionalId
  let secondProfessionalId = body.secondProfessionalId ?? null

  if (actuantesOrdered.length > 0) {
    ;({ principalProfessionalId, secondProfessionalId } = principalSecondFromActuantes(actuantesOrdered))
  } else {
    const principal = await prisma.baroProfessional.findFirst({
      where: { id: body.principalProfessionalId, companyId: ctx.companyId },
    })
    if (!principal) throw new Error('Profesional principal no encontrado en la empresa')
    if (body.secondProfessionalId) {
      const second = await prisma.baroProfessional.findFirst({
        where: { id: body.secondProfessionalId, companyId: ctx.companyId },
      })
      if (!second) throw new Error('Segundo profesional no encontrado en la empresa')
    }
  }

  const created = await prisma.$transaction(async (tx) => {
    const expediente = await tx.baroExpediente.create({
      data: {
        companyId: ctx.companyId,
        createdById: ctx.userId,
        objetoExpedienteId: body.objetoExpedienteId,
        nomenclaturaCatastral: body.nomenclaturaCatastral,
        nomenclaturaAnulada: body.nomenclaturaAnulada ?? false,
        propietario: body.propietario,
        principalProfessionalId,
        secondProfessionalId,
        status: 'DRAFT',
        fechaOrdenTrabajo: optTrim(body.fechaOrdenTrabajo ?? null),
        planoAntecedente: optTrim(body.planoAntecedente ?? null),
        loteFraccion: optTrim(body.loteFraccion ?? null),
        domicilioParcela: optTrim(body.domicilioParcela ?? null),
        parcial: body.parcial ?? false,
        soloOrdenTrabajo: body.soloOrdenTrabajo ?? false,
        domicilioPropietario: optTrim(body.domicilioPropietario ?? null),
        inscripcionDominio: optTrim(body.inscripcionDominio ?? null),
        naturalezaActo: optTrim(body.naturalezaActo ?? null),
        memoriaObservaciones: optTrim(body.memoriaObservaciones ?? null),
        motivoHidraulica: optTrim(body.motivoHidraulica ?? null),
        motivoFiscalia: optTrim(body.motivoFiscalia ?? null),
        municipio: optTrim(body.municipio ?? null),
        requiereVisacionMunicipal: body.requiereVisacionMunicipal ?? false,
        actuantes: actuantesOrdered.length
          ? {
              create: actuantesOrdered.map((professionalId, orden) => ({ professionalId, orden })),
            }
          : undefined,
        ordenantes: body.ordenantes?.length
          ? {
              create: body.ordenantes
                .filter((o) => o.nombre.trim())
                .map((o, orden) => ({
                  orden,
                  nombre: o.nombre.trim(),
                  documento: o.documento.trim(),
                  sexo: o.sexo.trim(),
                  cuit: o.cuit.trim(),
                  domicilio: o.domicilio.trim(),
                  caracter: o.caracter.trim(),
                  esPropietario: o.esPropietario,
                })),
            }
          : undefined,
      },
      include: { principalProfessional: { select: { displayName: true } } },
    })
    return expediente
  })

  return toExpediente(created)
}

export async function updateExpedienteFull(
  ctx: CompanyContext,
  expedienteId: string,
  body: UpdateBaroExpedienteFullBody
): Promise<void> {
  const owned = await prisma.baroExpediente.findFirst({
    where: { id: expedienteId, companyId: ctx.companyId },
    select: { id: true },
  })
  if (!owned) throw new Error('Expediente no encontrado')

  const datos = body.datos as {
    actuantesIds?: string[]
    objetoExpedienteId?: string
    nomenclaturaCatastral?: string
    nomenclaturaAnulada?: boolean
    planoAntecedente?: string | null
    loteFraccion?: string | null
    domicilioParcela?: string | null
    parcial?: boolean
    soloOrdenTrabajo?: boolean
    fechaOrdenTrabajo?: string | null
    propietario?: string
    domicilioPropietario?: string | null
    inscripcionDominio?: string | null
    naturalezaActo?: string | null
    memoriaObservaciones?: string | null
    motivoHidraulica?: string | null
    motivoFiscalia?: string | null
    municipio?: string | null
    requiereVisacionMunicipal?: boolean
  }

  const pub = body.publicacion as Record<string, unknown>
  const cols = body.colindantes as Array<{
    id?: string | null
    colindante: string
    descripcion?: string | null
    notificaA: string
    nomenclaturas: Array<{ nomenclatura: string; rumbo: string }>
    domicilioParcelaColindante: string
    domicilioTitularColindante: string
    dirigidoA: string
  }>
  const tits = body.titulos as Array<{
    id?: string | null
    instrumento: string
    matricula: string
    fechaTitulo: string
    observaciones?: string | null
  }>
  const ords = body.ordenantes as Array<{
    id?: string | null
    nombre: string
    documento: string
    sexo: string
    cuit: string
    domicilio: string
    caracter: string
    esPropietario: boolean
  }>
  const l = body.linderos as {
    superficieTotal: string
    superficieSegun: string
    fechaRelacionTitulos: string
    observacionesGenerales: string
    puntos: Array<{
      id?: string | null
      tipo: string
      direccion: string
      descripcion: string
      medida: string
    }>
  }

  const actuantesOrdered = (datos.actuantesIds ?? []).map((x) => x.trim()).filter(Boolean)
  if (actuantesOrdered.length > 0) await assertProfessionalsInCompany(ctx, actuantesOrdered)

  const existing = await prisma.baroExpediente.findUnique({
    where: { id: expedienteId },
    select: {
      principalProfessionalId: true,
      secondProfessionalId: true,
      colindantes: { select: { id: true } },
      tituloRelaciones: { select: { id: true } },
      ordenantes: { select: { id: true } },
      linderos: { select: { id: true, puntos: { select: { id: true } } } },
    },
  })

  const { principalProfessionalId, secondProfessionalId } = principalSecondForPersist(
    actuantesOrdered,
    existing
      ? {
          principalProfessionalId: existing.principalProfessionalId,
          secondProfessionalId: existing.secondProfessionalId,
        }
      : null
  )

  const existingColIds = new Set(existing?.colindantes.map((c) => c.id) ?? [])
  const existingTitIds = new Set(existing?.tituloRelaciones.map((t) => t.id) ?? [])
  const existingOrdIds = new Set(existing?.ordenantes.map((o) => o.id) ?? [])
  const existingPuntoIds = new Set(existing?.linderos?.puntos.map((p) => p.id) ?? [])

  const submittedColIds = new Set(cols.filter((c) => c.id).map((c) => c.id!))
  const submittedTitIds = new Set(tits.filter((t) => t.id).map((t) => t.id!))
  const submittedOrdIds = new Set(ords.filter((o) => o.id).map((o) => o.id!))
  const submittedPuntoIds = new Set(l.puntos.filter((p) => p.id).map((p) => p.id!))

  const colToDelete = [...existingColIds].filter((id) => !submittedColIds.has(id))
  const titToDelete = [...existingTitIds].filter((id) => !submittedTitIds.has(id))
  const ordToDelete = [...existingOrdIds].filter((id) => !submittedOrdIds.has(id))
  const puntoToDelete = [...existingPuntoIds].filter((id) => !submittedPuntoIds.has(id))

  const fechaOrdenTrabajoPersist = optTrim(datos.fechaOrdenTrabajo ?? null)

  await prisma.$transaction(async (tx) => {
    await tx.baroExpediente.update({
      where: { id: expedienteId },
      data: {
        principalProfessionalId,
        secondProfessionalId,
        objetoExpedienteId: datos.objetoExpedienteId ?? '',
        nomenclaturaCatastral: datos.nomenclaturaCatastral ?? '',
        nomenclaturaAnulada: datos.nomenclaturaAnulada ?? false,
        planoAntecedente: optTrim(datos.planoAntecedente ?? null),
        loteFraccion: optTrim(datos.loteFraccion ?? null),
        domicilioParcela: optTrim(datos.domicilioParcela ?? null),
        parcial: datos.parcial ?? false,
        soloOrdenTrabajo: datos.soloOrdenTrabajo ?? false,
        fechaOrdenTrabajo: datos.soloOrdenTrabajo ? fechaOrdenTrabajoPersist : null,
        propietario: (datos.propietario ?? '').trim(),
        domicilioPropietario: optTrim(datos.domicilioPropietario ?? null),
        inscripcionDominio: optTrim(datos.inscripcionDominio ?? null),
        naturalezaActo: optTrim(datos.naturalezaActo ?? null),
        memoriaObservaciones: optTrim(datos.memoriaObservaciones ?? null),
        motivoHidraulica: optTrim(datos.motivoHidraulica ?? null),
        motivoFiscalia: optTrim(datos.motivoFiscalia ?? null),
        municipio: optTrim(datos.municipio ?? null),
        requiereVisacionMunicipal: datos.requiereVisacionMunicipal ?? false,
        publicacionEdictoFecha: (pub.publicacionEdictoFecha as string | null | undefined) ?? null,
        publicacionEdictoNumero: (pub.publicacionEdictoNumero as string | null | undefined) ?? null,
        boletinOficialNota: (pub.boletinOficialNota as string | null | undefined) ?? null,
        actaNotarialNumero: (pub.actaNotarialNumero as string | null | undefined) ?? null,
        actaNotarialFecha: (pub.actaNotarialFecha as string | null | undefined) ?? null,
        publicacionActaObservaciones: (pub.publicacionActaObservaciones as string | null | undefined) ?? null,
        lugarReunion: (pub.lugarReunion as string | null | undefined) ?? null,
        toleranciaActa: (pub.toleranciaActa as string | null | undefined) ?? null,
        llevPublicacionEdictos: (pub.llevPublicacionEdictos as boolean | undefined) ?? false,
        medioPublicacion: (pub.medioPublicacion as string | null | undefined) ?? null,
      },
    })

    await replaceExpedienteActuantes(tx, expedienteId, actuantesOrdered)

    if (colToDelete.length > 0) {
      await tx.baroExpedienteColindante.deleteMany({ where: { id: { in: colToDelete } } })
    }
    for (let i = 0; i < cols.length; i++) {
      const c = cols[i]!
      const baseData = {
        orden: i,
        distancia: '',
        colindante: c.colindante,
        descripcion: optTrim(c.descripcion ?? null),
        notificaA: c.notificaA,
        domicilioParcelaColindante: c.domicilioParcelaColindante.trim(),
        domicilioTitularColindante: c.domicilioTitularColindante.trim(),
        dirigidoA: c.dirigidoA.trim(),
      }
      let colId: string
      if (c.id && existingColIds.has(c.id)) {
        await tx.baroExpedienteColindante.update({ where: { id: c.id }, data: baseData })
        colId = c.id
      } else {
        const created = await tx.baroExpedienteColindante.create({
          data: { expedienteId, ...baseData },
          select: { id: true },
        })
        colId = created.id
      }
      await tx.baroExpedienteColindanteNomenclatura.deleteMany({ where: { colindanteId: colId } })
      await tx.baroExpedienteColindanteNomenclatura.createMany({
        data: c.nomenclaturas.map((n, j) => ({
          colindanteId: colId,
          orden: j,
          nomenclatura: n.nomenclatura.trim(),
          rumbo: n.rumbo.trim(),
        })),
      })
    }

    if (titToDelete.length > 0) {
      await tx.baroExpedienteTituloRelacion.deleteMany({ where: { id: { in: titToDelete } } })
    }
    for (let i = 0; i < tits.length; i++) {
      const t = tits[i]!
      const obs = optTrim(t.observaciones ?? null)
      if (t.id && existingTitIds.has(t.id)) {
        await tx.baroExpedienteTituloRelacion.update({
          where: { id: t.id },
          data: {
            orden: i,
            instrumento: t.instrumento,
            matricula: t.matricula,
            fechaTitulo: t.fechaTitulo,
            observaciones: obs,
          },
        })
      } else {
        await tx.baroExpedienteTituloRelacion.create({
          data: {
            expedienteId,
            orden: i,
            instrumento: t.instrumento,
            matricula: t.matricula,
            fechaTitulo: t.fechaTitulo,
            observaciones: obs,
          },
        })
      }
    }

    if (ordToDelete.length > 0) {
      await tx.baroExpedienteOrdenante.deleteMany({ where: { id: { in: ordToDelete } } })
    }
    for (let i = 0; i < ords.length; i++) {
      const o = ords[i]!
      if (o.id && existingOrdIds.has(o.id)) {
        await tx.baroExpedienteOrdenante.update({
          where: { id: o.id },
          data: {
            orden: i,
            nombre: o.nombre,
            documento: o.documento,
            sexo: o.sexo,
            cuit: o.cuit,
            domicilio: o.domicilio,
            caracter: o.caracter,
            esPropietario: o.esPropietario,
          },
        })
      } else {
        await tx.baroExpedienteOrdenante.create({
          data: {
            expedienteId,
            orden: i,
            nombre: o.nombre,
            documento: o.documento,
            sexo: o.sexo,
            cuit: o.cuit,
            domicilio: o.domicilio,
            caracter: o.caracter,
            esPropietario: o.esPropietario,
          },
        })
      }
    }

    const linderoData = {
      superficieTotal: l.superficieTotal,
      superficieSegun: l.superficieSegun,
      fechaRelacionTitulos: l.fechaRelacionTitulos,
      observacionesGenerales: l.observacionesGenerales,
    }
    const linderosSaved = await tx.baroExpedienteLinderos.upsert({
      where: { expedienteId },
      create: { expedienteId, ...linderoData },
      update: linderoData,
      select: { id: true },
    })

    if (puntoToDelete.length > 0) {
      await tx.baroExpedienteLinderoPunto.deleteMany({ where: { id: { in: puntoToDelete } } })
    }
    for (let i = 0; i < l.puntos.length; i++) {
      const p = l.puntos[i]!
      if (p.id && existingPuntoIds.has(p.id)) {
        await tx.baroExpedienteLinderoPunto.update({
          where: { id: p.id },
          data: {
            orden: i,
            tipo: p.tipo,
            direccion: p.direccion,
            descripcion: p.descripcion,
            medida: p.medida,
          },
        })
      } else {
        await tx.baroExpedienteLinderoPunto.create({
          data: {
            linderosId: linderosSaved.id,
            orden: i,
            tipo: p.tipo,
            direccion: p.direccion,
            descripcion: p.descripcion,
            medida: p.medida,
          },
        })
      }
    }
  })
}

export async function deleteExpediente(ctx: CompanyContext, id: string): Promise<void> {
  const row = await prisma.baroExpediente.findFirst({
    where: { id, companyId: ctx.companyId },
    select: { id: true },
  })
  if (!row) throw new Error('Expediente no encontrado')
  await prisma.baroExpediente.delete({ where: { id } })
}
