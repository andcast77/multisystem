import { ApiClient as SharedApiClient } from "@multisystem/shared";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

const apiClient = new SharedApiClient(API_URL);

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
