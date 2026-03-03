/**
 * API client for Hub - auth endpoints and authenticated requests.
 */

import { getTokenFromCookie } from "./auth";
import type { Company, CompanyStats, CompanyMember, UpdateCompanyInput } from "@/types/company";
import type {
  LoginResponse,
  MeResponse,
  ContextResponse,
  CompaniesResponse,
  RegisterResponse,
  CompanyRow,
} from "@multisystem/contracts";

export type { LoginResponse, MeResponse, ContextResponse, CompaniesResponse, RegisterResponse, CompanyRow };

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export type CompanyUpdateResult = {
  id: string;
  name: string;
  workifyEnabled: boolean;
  shopflowEnabled: boolean;
  technicalServicesEnabled: boolean;
  updatedAt: string;
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

  // Email verification endpoints
  verifyEmail: (token: string) =>
    request<{ success: boolean; message?: string; error?: string; token?: string; user?: { id: string; email: string; role: string; firstName?: string; lastName?: string } }>(
      `/api/auth/verify-email?token=${token}`
    ),

  resendVerification: (email: string) =>
    request<{ success: boolean; message?: string; error?: string }>(
      "/api/auth/resend-verification",
      {
        method: "POST",
        body: JSON.stringify({ email }),
      }
    ),

  // Password reset endpoints
  forgotPassword: (email: string) =>
    request<{ success: boolean; message?: string; error?: string }>(
      "/api/auth/forgot-password",
      {
        method: "POST",
        body: JSON.stringify({ email }),
      }
    ),

  resetPassword: (token: string, newPassword: string) =>
    request<{ success: boolean; message?: string; error?: string }>(
      "/api/auth/reset-password",
      {
        method: "POST",
        body: JSON.stringify({ token, newPassword }),
      }
    ),
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
    request<{ success: boolean; data: CompanyUpdateResult; message?: string; error?: string }>(
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
