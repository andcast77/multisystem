import { z } from 'zod'

export const createBaroExpedienteSchema = z.object({
  objetoExpedienteId: z.string().trim().min(1),
  nomenclaturaCatastral: z.string().trim().min(1),
  nomenclaturaAnulada: z.boolean().optional(),
  propietario: z.string().trim().min(1),
  principalProfessionalId: z.string().uuid(),
  secondProfessionalId: z.string().uuid().optional(),
  actuantesIds: z.array(z.string().uuid()).optional(),
  fechaOrdenTrabajo: z.string().nullable().optional(),
  planoAntecedente: z.string().nullable().optional(),
  loteFraccion: z.string().nullable().optional(),
  domicilioParcela: z.string().nullable().optional(),
  parcial: z.boolean().optional(),
  soloOrdenTrabajo: z.boolean().optional(),
  domicilioPropietario: z.string().nullable().optional(),
  inscripcionDominio: z.string().nullable().optional(),
  naturalezaActo: z.string().nullable().optional(),
  memoriaObservaciones: z.string().nullable().optional(),
  motivoHidraulica: z.string().nullable().optional(),
  motivoFiscalia: z.string().nullable().optional(),
  municipio: z.string().nullable().optional(),
  requiereVisacionMunicipal: z.boolean().optional(),
  ordenantes: z
    .array(
      z.object({
        nombre: z.string().trim().min(1),
        documento: z.string().trim().default(''),
        sexo: z.string().trim().default(''),
        cuit: z.string().trim().default(''),
        domicilio: z.string().trim().default(''),
        caracter: z.string().trim().default(''),
        esPropietario: z.boolean().default(false),
      })
    )
    .optional(),
})

export type CreateBaroExpedienteBody = z.infer<typeof createBaroExpedienteSchema>

const optionalTrimmed = z.union([z.string(), z.null(), z.undefined()]).transform((v) => {
  if (v == null) return null
  const t = v.trim()
  return t.length === 0 ? null : t
})

export const baroProfessionalRegistrationSchema = z.object({
  licenseNumber: z.string().trim().min(1),
  jurisdiction: z.string().trim().min(1),
  bodyName: optionalTrimmed,
})

export const baroProfessionalUpsertSchema = z.object({
  profesionalPrincipalId: optionalTrimmed,
  active: z.boolean().optional(),
  professionalTitle: z.enum(['AGRIMENSOR', 'INGENIERO_AGRIMENSOR']),
  displayName: z.string().trim().min(2).max(200),
  dni: z.string().trim().min(1),
  sexo: z.string().trim().min(1),
  phone: optionalTrimmed,
  whatsapp: optionalTrimmed,
  professionalEmail: optionalTrimmed,
  addressLine1: z.string().trim().min(1).max(200),
  addressLine2: optionalTrimmed,
  locality: z.string().trim().min(1).max(120),
  province: z.string().trim().min(1).max(120).default('San Juan'),
  postalCode: optionalTrimmed,
  websiteUrl: optionalTrimmed,
  cuit: z.string().trim().min(1),
  registrations: z.array(baroProfessionalRegistrationSchema).min(1),
})

export type BaroProfessionalUpsertBody = z.infer<typeof baroProfessionalUpsertSchema>

export const baroSetTitularSchema = z.object({
  profesionalPrincipalId: z.string().trim().min(1),
})

export const updateBaroExpedienteFullSchema = z.object({
  datos: z.record(z.string(), z.unknown()),
  publicacion: z.record(z.string(), z.unknown()),
  colindantes: z.array(z.record(z.string(), z.unknown())),
  titulos: z.array(z.record(z.string(), z.unknown())),
  ordenantes: z.array(z.record(z.string(), z.unknown())),
  linderos: z.record(z.string(), z.unknown()),
})

export type UpdateBaroExpedienteFullBody = z.infer<typeof updateBaroExpedienteFullSchema>

export type BaroProfessionalResponse = {
  id: string
  companyId: string
  userId: string | null
  displayName: string
  professionalTitle: string
  titleGrammarGender?: string
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
  registrations?: Array<{
    id: string
    licenseNumber: string
    jurisdiction: string
    bodyName: string | null
    createdAt?: string
  }>
  primaryMatricula?: string | null
  primaryJurisdiction?: string | null
  isTitular?: boolean
}

export type BaroExpedienteResponse = {
  id: string
  companyId: string
  status: string
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

export type BaroMeResponse = {
  user: {
    id: string
    email: string
    emailVerified: string | null
  }
  profile: {
    displayName: string
    professionalTitle: 'AGRIMENSOR' | 'INGENIERO_AGRIMENSOR'
    titleGrammarGender: 'MASCULINO' | 'FEMENINO'
    titularProfessionalId: string
  } | null
}
