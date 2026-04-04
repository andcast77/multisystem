/**
 * API client for Hub - auth endpoints and authenticated requests.
 */

import type { Company, CompanyStats, CompanyMember, UpdateCompanyInput } from "@/types/company";

export type MemberModuleItem = {
  moduleId: string;
  key: string;
  name: string;
  enabled: boolean;
};

export type MemberRoleItem = {
  roleId: string;
  name: string;
  description: string | null;
  assigned: boolean;
};
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
    client.post<LoginResponse>("/v1/auth/login", { email, password, companyId }),

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
    client.post<RegisterResponse>("/v1/auth/register", data),

  me: () => client.get<MeResponse>("/v1/auth/me"),

  context: (companyId: string) =>
    client.post<ContextResponse>("/v1/auth/context", { companyId }),

  companies: () => client.get<CompaniesResponse>("/v1/auth/companies"),

  logout: () =>
    client.post<{ success: boolean }>("/v1/auth/logout", {}),

  // Email verification endpoints
  verifyEmail: (token: string) =>
    client.get<{
      success: boolean;
      message?: string;
      error?: string;
      token?: string;
      user?: { id: string; email: string; role: string; firstName?: string; lastName?: string };
    }>(`/v1/auth/verify-email?token=${token}`),

  resendVerification: (email: string) =>
    client.post<{ success: boolean; message?: string; error?: string }>("/v1/auth/resend-verification", { email }),

  // Password reset endpoints
  forgotPassword: (email: string) =>
    client.post<{ success: boolean; message?: string; error?: string }>("/v1/auth/forgot-password", { email }),

  resetPassword: (token: string, newPassword: string) =>
    client.post<{ success: boolean; message?: string; error?: string }>("/v1/auth/reset-password", { token, newPassword }),
};

export const accountApi = {
  acceptPrivacy: () =>
    client.post<{ success: boolean; message?: string }>("/v1/account/accept-privacy", {}),

  exportMyData: () =>
    client.get<{ success: boolean; data: Record<string, unknown> }>("/v1/account/my-data"),

  deleteMyData: () =>
    client.delete<{ success: boolean; message?: string }>("/v1/account/my-data"),
};

export type AuditLogUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
} | null;

export type AuditLogEntry = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  before: unknown;
  after: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  userId: string | null;
  user: AuditLogUser;
};

export type AuditLogPagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type AuditLogResponse = {
  items: AuditLogEntry[];
  pagination: AuditLogPagination;
};

export type AuditLogFilters = {
  entityType?: string;
  action?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
};

export const auditLogApi = {
  list: (filters: AuditLogFilters = {}) => {
    const params = new URLSearchParams();
    if (filters.entityType) params.set("entityType", filters.entityType);
    if (filters.action) params.set("action", filters.action);
    if (filters.userId) params.set("userId", filters.userId);
    if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.set("dateTo", filters.dateTo);
    if (filters.page) params.set("page", String(filters.page));
    if (filters.pageSize) params.set("pageSize", String(filters.pageSize));
    const qs = params.toString();
    return client.get<{ success: boolean; data: AuditLogResponse; error?: string }>(
      `/v1/company/audit-logs${qs ? `?${qs}` : ""}`
    );
  },
};

export type JobRunRecord = {
  id: string;
  companyId: string;
  jobName: string;
  status: "running" | "success" | "error";
  startedAt: number;
  finishedAt?: number;
  error?: string | null;
  meta?: Record<string, unknown> | null;
};

export type JobHistoryResponse = {
  items: JobRunRecord[];
  total: number;
};

export const jobsApi = {
  getHistory: (limit = 50) =>
    client.get<{ success: boolean; data: JobHistoryResponse; error?: string }>(
      `/v1/company/jobs/history?limit=${limit}`
    ),
};

export const companyApi = {
  getCompany: (id: string) =>
    client.get<{ success: boolean; data: Company; error?: string }>(`/v1/companies/${id}`),

  getCompanyStats: (id: string) =>
    client.get<{ success: boolean; data: CompanyStats; error?: string }>(`/v1/companies/${id}/stats`),

  updateCompany: (id: string, data: UpdateCompanyInput) =>
    client.put<{ success: boolean; data: CompanyUpdateResult; message?: string; error?: string }>(`/v1/companies/${id}`, data),

  deleteCompany: (id: string) =>
    client.delete<{ success: boolean; message?: string; error?: string }>(`/v1/companies/${id}`),

  getCompanyMembers: (id: string) =>
    client.get<{ success: boolean; data: CompanyMember[]; error?: string }>(`/v1/companies/${id}/members`),

  getMemberModules: (companyId: string, memberId: string) =>
    client.get<{ success: boolean; data: MemberModuleItem[]; error?: string }>(
      `/v1/companies/${companyId}/members/${memberId}/modules`
    ),

  updateMemberModules: (companyId: string, memberId: string, modules: { moduleId: string; enabled: boolean }[]) =>
    client.put<{ success: boolean; data: MemberModuleItem[]; error?: string }>(
      `/v1/companies/${companyId}/members/${memberId}/modules`,
      { modules }
    ),

  getMemberRoles: (companyId: string, memberId: string) =>
    client.get<{ success: boolean; data: MemberRoleItem[]; error?: string }>(
      `/v1/companies/${companyId}/members/${memberId}/roles`
    ),

  updateMemberRoles: (companyId: string, memberId: string, roleIds: string[]) =>
    client.put<{ success: boolean; data: MemberRoleItem[]; error?: string }>(
      `/v1/companies/${companyId}/members/${memberId}/roles`,
      { roleIds }
    ),
};
