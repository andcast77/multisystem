import type { CompanyRow, CompanyModules } from './company.js'

/** Session is httpOnly cookie on API host; no token in JSON. */
export type LoginResponse = {
  user: {
    id: string
    email: string
    name: string
    role: string
    isSuperuser: boolean
  }
  companyId?: string
  company?: CompanyRow
  companies?: CompanyRow[]
  /** When true, password was OK but MFA is required — use tempToken with /v1/auth/mfa/verify. */
  mfaRequired?: boolean
  tempToken?: string
}

export type RegisterResponse = {
  user: {
    id: string
    email: string
    name: string
    role: string
    companyId?: string
  }
  company?: {
    id: string
    name: string
    modules: CompanyModules
  }
}

export type MeResponse = {
  id: string
  email: string
  role: string
  isActive: boolean
  name: string
  companyId?: string
  preferredCompanyId?: string
  membershipRole?: string
  isSuperuser?: boolean
  twoFactorEnabled?: boolean
  company?: {
    id: string
    name: string
    modules: CompanyModules
  }
}

export type ContextResponse = {
  companyId: string
  /** Rol de membresía en la empresa seleccionada (si aplica). */
  membershipRole?: string | null
}

export type CompaniesResponse = CompanyRow[]

export type ApiResponse<T = unknown> = {
  success: boolean
  data?: T
  error?: string
  message?: string
}
