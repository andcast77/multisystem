/**
 * API client for Hub - auth endpoints and authenticated requests.
 */

import { getTokenFromCookie } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export type LoginResponse = {
  success: boolean;
  data?: {
    user: { id: string; email: string; name: string; role: string; isSuperuser?: boolean };
    token: string;
    companyId?: string;
    company?: { id: string; name: string; workifyEnabled: boolean; shopflowEnabled: boolean };
    companies?: Array<{ id: string; name: string; workifyEnabled: boolean; shopflowEnabled: boolean }>;
  };
  error?: string;
};

export type MeResponse = {
  success: boolean;
  data?: {
    id: string;
    email: string;
    name: string;
    role: string;
    companyId?: string;
    membershipRole?: string;
    isSuperuser?: boolean;
    company?: { id: string; name: string; workifyEnabled: boolean; shopflowEnabled: boolean };
  };
  error?: string;
};

export type ContextResponse = {
  success: boolean;
  data?: {
    token: string;
    companyId: string;
    company: { id: string; name: string; workifyEnabled: boolean; shopflowEnabled: boolean };
  };
  error?: string;
};

export type CompaniesResponse = {
  success: boolean;
  data?: Array<{ id: string; name: string; workifyEnabled: boolean; shopflowEnabled: boolean }>;
  error?: string;
};

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  const token = getTokenFromCookie();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(url, { headers, credentials: "include", ...options });
  const data = await res.json();

  if (!res.ok) {
    const msg = data?.error || data?.message || `API Error: ${res.status}`;
    throw new Error(msg);
  }

  return data as T;
}

export const authApi = {
  login: (email: string, password: string, companyId?: string) =>
    request<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password, companyId }),
    }),

  me: () => request<MeResponse>("/api/auth/me"),

  context: (companyId: string) =>
    request<ContextResponse>("/api/auth/context", {
      method: "POST",
      body: JSON.stringify({ companyId }),
    }),

  companies: () => request<CompaniesResponse>("/api/auth/companies"),
};
