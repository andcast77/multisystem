// API Client for Workify Frontend
// All data from central API (NEXT_PUBLIC_API_URL). No internal Next.js API routes for data.

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

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

    const response = await fetch(url, {
      headers,
      credentials: 'include',
      ...options,
    })

    if (!response.ok) {
      let errorMessage = `API Error: ${response.status} ${response.statusText}`
      try {
        const errorData = await response.json()
        if (errorData.error) errorMessage = errorData.error
        else if (errorData.message) errorMessage = errorData.message
      } catch {
        // ignore
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

const apiClient = new ApiClient(API_URL)

/** Auth headers for fetch (e.g. FormData). */
export function getAuthHeaders(): HeadersInit {
  return {}
}

// Workify API: prefix /api/workify (central API)
export const workifyApi = {
  get: <T>(endpoint: string, options?: RequestInit) =>
    apiClient.get<T>(`/api/workify${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`, options),
  post: <T>(endpoint: string, data?: unknown, options?: RequestInit) =>
    apiClient.post<T>(`/api/workify${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`, data, options),
  put: <T>(endpoint: string, data?: unknown, options?: RequestInit) =>
    apiClient.put<T>(`/api/workify${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`, data, options),
  delete: <T>(endpoint: string, data?: unknown, options?: RequestInit) =>
    apiClient.delete<T>(`/api/workify${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`, data, options),
}

// Auth API: prefix /api/auth
export const authApi = {
  get: <T>(endpoint: string, options?: RequestInit) => apiClient.get<T>(`/api/auth${endpoint}`, options),
  post: <T>(endpoint: string, data?: unknown, options?: RequestInit) =>
    apiClient.post<T>(`/api/auth${endpoint}`, data, options),
  put: <T>(endpoint: string, data?: unknown, options?: RequestInit) =>
    apiClient.put<T>(`/api/auth${endpoint}`, data, options),
  delete: <T>(endpoint: string, options?: RequestInit) => apiClient.delete<T>(`/api/auth${endpoint}`, options),
}

// Company members API (usuarios de la empresa - misma lista en Workify y Shopflow)
export const companiesApi = {
  getMembers: <T>(companyId: string) =>
    apiClient.get<T>(`/api/companies/${companyId}/members`),
  createMember: <T>(companyId: string, data: { email: string; password: string; firstName?: string; lastName?: string; membershipRole: 'ADMIN' | 'USER' }) =>
    apiClient.post<T>(`/api/companies/${companyId}/members`, data),
}

// Generic API response types (from shared contracts)
export type { ApiResponse } from '@multisystem/contracts'

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
