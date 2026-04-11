import { z } from 'zod'

/** Input DTO: login */
export const loginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  companyId: z.string().uuid().optional(),
})

export type LoginBody = z.infer<typeof loginBodySchema>

export const mfaVerifyTotpSchema = z.object({
  tempToken: z.string().min(1),
  companyId: z.string().uuid().optional(),
  totpCode: z.string().min(1),
})

export type MfaVerifyTotpBody = z.infer<typeof mfaVerifyTotpSchema>

export const mfaVerifyBackupSchema = z.object({
  tempToken: z.string().min(1),
  companyId: z.string().uuid().optional(),
  backupCode: z.string().min(1),
})

export type MfaVerifyBackupBody = z.infer<typeof mfaVerifyBackupSchema>

/** Input DTO: register — con `companyName` no vacío se exige `registrationTicket` (PLAN-39). */
export const registerBodySchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(1),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    companyName: z.string().optional(),
    registrationTicket: z.string().min(1).optional(),
    workifyEnabled: z.boolean().optional(),
    shopflowEnabled: z.boolean().optional(),
    technicalServicesEnabled: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    const cn = data.companyName?.trim()
    if (cn) {
      if (!data.registrationTicket?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Se requiere verificación por email antes de registrar la empresa (registrationTicket).',
          path: ['registrationTicket'],
        })
      }
    }
  })

export type RegisterBody = z.infer<typeof registerBodySchema>

export const registerOtpSendBodySchema = z.object({
  email: z.string().email(),
  captchaToken: z.string().min(1),
})

export type RegisterOtpSendBody = z.infer<typeof registerOtpSendBodySchema>

export const registerOtpVerifyBodySchema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{6}$/, 'El código debe tener 6 dígitos'),
})

export type RegisterOtpVerifyBody = z.infer<typeof registerOtpVerifyBodySchema>

export const verifyEmailQuerySchema = z.object({
  token: z.string().min(1),
})

export const resendVerificationBodySchema = z.object({
  email: z.string().email(),
})

/** Input DTO: verify token */
export const verifyTokenSchema = z.object({
  token: z.string().min(1),
})

/** Input DTO: set context (switch company) */
export const setContextSchema = z.object({
  companyId: z.string().uuid(),
})

/** Input DTO: create session */
export const createSessionSchema = z.object({
  userId: z.string().uuid(),
  sessionToken: z.string().min(1),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  expiresAt: z.string().optional(),
})

/** Input DTO: terminate other sessions — `currentSessionToken` opcional si hay cookie `ms_refresh`. */
export const terminateOthersSessionsSchema = z.object({
  userId: z.string().uuid(),
  currentSessionToken: z.string().min(1).optional(),
})

/** Input DTO: validate session query */
export const validateSessionQuerySchema = z.object({
  token: z.string().min(1),
})

/** Input DTO: list sessions query — sin `userId` se usa el usuario autenticado. */
export const listSessionsQuerySchema = z.object({
  userId: z.string().uuid().optional(),
})

/** Response DTO: user summary */
export type AuthUserResponse = {
  id: string
  email: string
  name: string
  role: string
  isSuperuser?: boolean
  companyId?: string
}

/** Response DTO: company with modules */
export type AuthCompanyResponse = {
  id: string
  name: string
  modules: { workify: boolean; shopflow: boolean; techservices: boolean }
}
