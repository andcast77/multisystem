import { z } from 'zod'

/** Input DTO: login */
export const loginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  companyId: z.string().uuid().optional(),
})

export type LoginBody = z.infer<typeof loginBodySchema>

/** Input DTO: register */
export const registerBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  companyName: z.string().optional(),
  workifyEnabled: z.boolean().optional(),
  shopflowEnabled: z.boolean().optional(),
  technicalServicesEnabled: z.boolean().optional(),
})

export type RegisterBody = z.infer<typeof registerBodySchema>

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

/** Input DTO: terminate other sessions */
export const terminateOthersSessionsSchema = z.object({
  userId: z.string().uuid(),
  currentSessionToken: z.string().min(1),
})

/** Input DTO: validate session query */
export const validateSessionQuerySchema = z.object({
  token: z.string().min(1),
})

/** Input DTO: list sessions query */
export const listSessionsQuerySchema = z.object({
  userId: z.string().uuid(),
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
