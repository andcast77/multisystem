export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

function getTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/token=([^;]+)/);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1].trim());
  } catch {
    return null;
  }
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = new Headers(options.headers);
    headers.set("Content-Type", "application/json");

    const token = getTokenFromCookie();
    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(url, {
      headers,
      credentials: "include",
      ...options,
    });

    if (!response.ok) {
      let errorMessage = `API Error: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.error) errorMessage = errorData.error;
        else if (errorData.message) errorMessage = errorData.message;
      } catch {
        // ignore
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { method: "GET", ...options });
  }

  post<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  put<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  delete<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      method: "DELETE",
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }
}

const apiClient = new ApiClient(API_URL);

export const techServicesApi = {
  get: <T>(endpoint: string, options?: RequestInit) =>
    apiClient.get<T>(`/api/techservices${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`, options),
  post: <T>(endpoint: string, data?: unknown, options?: RequestInit) =>
    apiClient.post<T>(`/api/techservices${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`, data, options),
  put: <T>(endpoint: string, data?: unknown, options?: RequestInit) =>
    apiClient.put<T>(`/api/techservices${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`, data, options),
  delete: <T>(endpoint: string, data?: unknown, options?: RequestInit) =>
    apiClient.delete<T>(`/api/techservices${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`, data, options),
};

export const authApi = {
  get: <T>(endpoint: string, options?: RequestInit) => apiClient.get<T>(`/api/auth${endpoint}`, options),
  post: <T>(endpoint: string, data?: unknown, options?: RequestInit) =>
    apiClient.post<T>(`/api/auth${endpoint}`, data, options),
};

export type { ApiResponse } from "@multisystem/contracts";
