// API Client for ShopFlow Frontend
// Points to unified API with module prefixes (all requests go to external API, not Next.js routes)

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

/** Read token from cookie (client-only). Cookie name must match login page. */
function getTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/token=([^;]+)/)
  if (!match) return null
  try {
    return decodeURIComponent(match[1].trim())
  } catch {
    return null
  }
}

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

class ApiClient {
  private baseURL: string

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`

    const headers = new Headers(options.headers)
    headers.set('Content-Type', 'application/json')

    const token = getTokenFromCookie()
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`)
    }
    const storeId = getStoreIdHeader()
    if (storeId && !headers.has('X-Store-Id')) {
      headers.set('X-Store-Id', storeId)
    }

    const response = await fetch(url, {
      headers,
      credentials: 'include',
      ...options,
    })

    if (!response.ok) {
      // Try to get error message from response body
      let errorMessage = `API Error: ${response.status} ${response.statusText}`
      try {
        const errorData = await response.json()
        if (errorData.error) {
          errorMessage = errorData.error
        } else if (errorData.message) {
          errorMessage = errorData.message
        }
      } catch {
        // Response body is not JSON, use default error message
      }
      throw new Error(errorMessage)
    }

    return response.json()
  }

  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', ...options })
  }

  async post<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    })
  }

  async put<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    })
  }

  async delete<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    })
  }
}

/** Auth headers for fetch to external API (e.g. FormData uploads). */
export function getAuthHeaders(): HeadersInit {
  const token = getTokenFromCookie()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// Unified API Client
export const apiClient = new ApiClient(API_URL)

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
