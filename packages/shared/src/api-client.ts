/**
 * Shared API client — sends httpOnly session cookie via credentials (API must set CORS origin).
 */
export class ApiClient {
  constructor(private baseURL: string) {}

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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
        // Response body is not JSON
      }
      throw new ApiError(errorMessage, response.status)
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

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/** Use credentials: 'include' for API calls; optional Bearer for server-side scripts. */
export function getAuthHeaders(bearerToken?: string | null): HeadersInit {
  return bearerToken ? { Authorization: `Bearer ${bearerToken}` } : {}
}

/**
 * Create a prefixed API client for a specific module.
 * Usage: createPrefixedApi(client, '/v1/shopflow')
 */
export function createPrefixedApi(client: ApiClient, prefix: string) {
  const normalize = (ep: string) => ep.startsWith('/') ? ep : `/${ep}`
  return {
    get: <T>(endpoint: string, options?: RequestInit) =>
      client.get<T>(`${prefix}${normalize(endpoint)}`, options),
    post: <T>(endpoint: string, data?: unknown, options?: RequestInit) =>
      client.post<T>(`${prefix}${normalize(endpoint)}`, data, options),
    put: <T>(endpoint: string, data?: unknown, options?: RequestInit) =>
      client.put<T>(`${prefix}${normalize(endpoint)}`, data, options),
    delete: <T>(endpoint: string, data?: unknown, options?: RequestInit) =>
      client.delete<T>(`${prefix}${normalize(endpoint)}`, data, options),
  }
}

export type PrefixedApi = ReturnType<typeof createPrefixedApi>

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export interface PaginatedResponse<T> {
  success: true
  data: T[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
