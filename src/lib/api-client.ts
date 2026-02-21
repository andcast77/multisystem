/**
 * API client for Hub - auth endpoints and authenticated requests.
 */

import { getTokenFromCookie } from "./auth";
import type { Company, CompanyStats, CompanyMember, UpdateCompanyInput } from "@/types/company";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export type LoginResponse = {
  success: boolean;
  data?: {
    user: { id: string; email: string; name: string; role: string; isSuperuser?: boolean };
    token: string;
    companyId?: string;
    company?: { id: string; name: string; workifyEnabled: boolean; shopflowEnabled: boolean; technicalServicesEnabled: boolean };
    companies?: Array<{ id: string; name: string; workifyEnabled: boolean; shopflowEnabled: boolean; technicalServicesEnabled: boolean }>;
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
    company?: { id: string; name: string; workifyEnabled: boolean; shopflowEnabled: boolean; technicalServicesEnabled: boolean };
  };
  error?: string;
};

export type ContextResponse = {
  success: boolean;
  data?: {
    token: string;
    companyId: string;
    company: { id: string; name: string; workifyEnabled: boolean; shopflowEnabled: boolean; technicalServicesEnabled: boolean };
  };
  error?: string;
};

export type CompaniesResponse = {
  success: boolean;
  data?: Array<{ id: string; name: string; workifyEnabled: boolean; shopflowEnabled: boolean; technicalServicesEnabled: boolean }>;
  error?: string;
};

export type RegisterResponse = {
  success: boolean;
  data?: {
    user: { id: string; email: string; name: string; role: string };
    token: string;
    company?: { id: string; name: string; workifyEnabled: boolean; shopflowEnabled: boolean; technicalServicesEnabled: boolean };
  };
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

  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    companyName: string;
    workifyEnabled?: boolean;
    shopflowEnabled?: boolean;
    technicalServicesEnabled?: boolean;
  }) =>
    request<RegisterResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  me: () => request<MeResponse>("/api/auth/me"),

  context: (companyId: string) =>
    request<ContextResponse>("/api/auth/context", {
      method: "POST",
      body: JSON.stringify({ companyId }),
    }),

  companies: () => request<CompaniesResponse>("/api/auth/companies"),
};

export const companyApi = {
  getCompany: (id: string) =>
    request<{ success: boolean; data: Company; error?: string }>(
      `/api/companies/${id}`
    ),

  getCompanyStats: (id: string) =>
    request<{ success: boolean; data: CompanyStats; error?: string }>(
      `/api/companies/${id}/stats`
    ),

  updateCompany: (id: string, data: UpdateCompanyInput) =>
    request<{ success: boolean; data: Company; message?: string; error?: string }>(
      `/api/companies/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      }
    ),

  deleteCompany: (id: string) =>
    request<{ success: boolean; message?: string; error?: string }>(
      `/api/companies/${id}`,
      {
        method: "DELETE",
      }
    ),

  getCompanyMembers: (id: string) =>
    request<{ success: boolean; data: CompanyMember[]; error?: string }>(
      `/api/companies/${id}/members`
    ),
};
