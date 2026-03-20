import { ApiClient as SharedApiClient } from '@multisystem/shared'

// API Client for ShopFlow Frontend
// Points to unified API with module prefixes (all requests go to external API, not Next.js routes)

const viteApiUrl = (import.meta as any).env?.VITE_API_URL as string | undefined
const legacyNextApiUrl = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_API_URL : undefined
export const API_URL = viteApiUrl || legacyNextApiUrl || 'http://localhost:3000'

/** Current store ID for X-Store-Id header (set by StoreContext). */
declare global {
  interface Window {
    __SHOPFLOW_STORE_ID?: string | null
  }
}
function getStoreIdHeader(): string | null {
  if (typeof window === 'undefined') return null
  const id = window.__SHOPFLOW_STORE_ID
  return id && typeof id === 'string' && id.trim() ? id.trim() : null
}

function withStoreIdHeader(options?: RequestInit): RequestInit {
  const storeId = getStoreIdHeader()
  if (!storeId) return options ?? {}

  const headers = new Headers(options?.headers)
  if (!headers.has('X-Store-Id')) headers.set('X-Store-Id', storeId)

  return { ...(options ?? {}), headers }
}

const sharedClient = new SharedApiClient(API_URL)

/** Auth headers for fetch to external API (e.g. FormData uploads). */
export function getAuthHeaders(): HeadersInit {
  return {}
}

// Unified API Client
export const apiClient = {
  get: <T>(endpoint: string, options?: RequestInit) => sharedClient.get<T>(endpoint, withStoreIdHeader(options)),
  post: <T>(endpoint: string, data?: unknown, options?: RequestInit) =>
    sharedClient.post<T>(endpoint, data, withStoreIdHeader(options)),
  put: <T>(endpoint: string, data?: unknown, options?: RequestInit) =>
    sharedClient.put<T>(endpoint, data, withStoreIdHeader(options)),
  delete: <T>(endpoint: string, data?: unknown, options?: RequestInit) =>
    sharedClient.delete<T>(endpoint, data, withStoreIdHeader(options)),
}

// ShopFlow API Client (uses /api/shopflow prefix)
export const shopflowApi = {
  get: <T>(endpoint: string, options?: RequestInit) => apiClient.get<T>(`/api/shopflow${endpoint}`, options),
  post: <T>(endpoint: string, data?: unknown, options?: RequestInit) => apiClient.post<T>(`/api/shopflow${endpoint}`, data, options),
  put: <T>(endpoint: string, data?: unknown, options?: RequestInit) => apiClient.put<T>(`/api/shopflow${endpoint}`, data, options),
  delete: <T>(endpoint: string, data?: unknown, options?: RequestInit) => apiClient.delete<T>(`/api/shopflow${endpoint}`, data, options),
}

// Auth API Client (uses /api/auth prefix)
export const authApi = {
  get: <T>(endpoint: string, options?: RequestInit) => apiClient.get<T>(`/api/auth${endpoint}`, options),
  post: <T>(endpoint: string, data?: unknown, options?: RequestInit) => apiClient.post<T>(`/api/auth${endpoint}`, data, options),
  put: <T>(endpoint: string, data?: unknown, options?: RequestInit) => apiClient.put<T>(`/api/auth${endpoint}`, data, options),
  delete: <T>(endpoint: string, options?: RequestInit) => apiClient.delete<T>(`/api/auth${endpoint}`, options),
}

// Company members API (usuarios de la empresa - misma lista en Workify y Shopflow)
export const companiesApi = {
  getMembers: <T>(companyId: string) => apiClient.get<T>(`/api/companies/${companyId}/members`),
  createMember: <T>(
    companyId: string,
    data: {
      email: string
      password: string
      firstName?: string
      lastName?: string
      membershipRole: 'ADMIN' | 'USER'
      storeIds?: string[]
    }
  ) => apiClient.post<T>(`/api/companies/${companyId}/members`, data),
  updateMemberStores: <T>(companyId: string, userId: string, storeIds: string[]) =>
    apiClient.put<T>(`/api/companies/${companyId}/members/${userId}/stores`, { storeIds }),
}

// Generic API response types
export interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}

/** Result type for endpoints that return { success, data? } or { success: false, error } */
export type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; data?: T }

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
