/**
 * API client for Hub - auth endpoints and authenticated requests.
 */

import type { Company, CompanyStats, CompanyMember, UpdateCompanyInput } from "@/types/company";
import type {
  LoginResponse,
  MeResponse,
  ContextResponse,
  CompaniesResponse,
  RegisterResponse,
  CompanyRow,
} from "@multisystem/contracts";

import { ApiClient } from "@multisystem/shared";

export type { LoginResponse, MeResponse, ContextResponse, CompaniesResponse, RegisterResponse, CompanyRow };

const API_URL = (import.meta as any).env.VITE_API_URL || "http://localhost:3000";

export type CompanyUpdateResult = {
  id: string;
  name: string;
  workifyEnabled: boolean;
  shopflowEnabled: boolean;
  technicalServicesEnabled: boolean;
  updatedAt: string;
};

const client = new ApiClient(API_URL);

export const authApi = {
  login: (email: string, password: string, companyId?: string) =>
    client.post<LoginResponse>("/api/auth/login", { email, password, companyId }),

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
    client.post<RegisterResponse>("/api/auth/register", data),

  me: () => client.get<MeResponse>("/api/auth/me"),

  context: (companyId: string) =>
    client.post<ContextResponse>("/api/auth/context", { companyId }),

  companies: () => client.get<CompaniesResponse>("/api/auth/companies"),

  logout: () =>
    client.post<{ success: boolean }>("/api/auth/logout", undefined),

  // Email verification endpoints
  verifyEmail: (token: string) =>
    client.get<{
      success: boolean;
      message?: string;
      error?: string;
      token?: string;
      user?: { id: string; email: string; role: string; firstName?: string; lastName?: string };
    }>(`/api/auth/verify-email?token=${token}`),

  resendVerification: (email: string) =>
    client.post<{ success: boolean; message?: string; error?: string }>("/api/auth/resend-verification", { email }),

  // Password reset endpoints
  forgotPassword: (email: string) =>
    client.post<{ success: boolean; message?: string; error?: string }>("/api/auth/forgot-password", { email }),

  resetPassword: (token: string, newPassword: string) =>
    client.post<{ success: boolean; message?: string; error?: string }>("/api/auth/reset-password", { token, newPassword }),
};

export const companyApi = {
  getCompany: (id: string) =>
    client.get<{ success: boolean; data: Company; error?: string }>(`/api/companies/${id}`),

  getCompanyStats: (id: string) =>
    client.get<{ success: boolean; data: CompanyStats; error?: string }>(`/api/companies/${id}/stats`),

  updateCompany: (id: string, data: UpdateCompanyInput) =>
    client.put<{ success: boolean; data: CompanyUpdateResult; message?: string; error?: string }>(`/api/companies/${id}`, data),

  deleteCompany: (id: string) =>
    client.delete<{ success: boolean; message?: string; error?: string }>(`/api/companies/${id}`),

  getCompanyMembers: (id: string) =>
    client.get<{ success: boolean; data: CompanyMember[]; error?: string }>(`/api/companies/${id}/members`),
};
