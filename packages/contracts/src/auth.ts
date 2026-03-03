import type { CompanyRow, CompanyModules } from './company.js'

export type LoginResponse = {
  user: {
    id: string
    email: string
    name: string
    role: string
    isSuperuser: boolean
  }
  token: string
  companyId?: string
  company?: CompanyRow
  companies?: CompanyRow[]
}

export type RegisterResponse = {
  user: {
    id: string
    email: string
    name: string
    role: string
    companyId?: string
  }
  token: string
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
  company?: {
    id: string
    name: string
    modules: CompanyModules
  }
}

export type ContextResponse = {
  companyId: string
  membershipRole?: string | null
}

export type CompaniesResponse = CompanyRow[]

export type ApiResponse<T = unknown> = {
  success: boolean
  data?: T
  error?: string
  message?: string
}
