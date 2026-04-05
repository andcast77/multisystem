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

import { ApiClient, type ApiResponse } from "@multisystem/shared";

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
    client.post<ApiResponse<LoginResponse>>("/v1/auth/login", { email, password, companyId }),

  verifyMfa: (tempToken: string, totpCode: string, companyId?: string) =>
    client.post<ApiResponse<LoginResponse>>("/v1/auth/mfa/verify", { tempToken, totpCode, companyId }),

  verifyMfaBackup: (tempToken: string, backupCode: string, companyId?: string) =>
    client.post<ApiResponse<LoginResponse>>("/v1/auth/mfa/verify-backup", { tempToken, backupCode, companyId }),

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
    client.post<ApiResponse<RegisterResponse>>("/v1/auth/register", data),

  me: () => client.get<ApiResponse<MeResponse>>("/v1/auth/me"),

  context: (companyId: string) =>
    client.post<ApiResponse<ContextResponse>>("/v1/auth/context", { companyId }),

  companies: () => client.get<ApiResponse<CompaniesResponse>>("/v1/auth/companies"),

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

  mfaSetup: () =>
    client.post<{ success: boolean; data?: { otpauthUrl: string; qrDataUrl: string }; error?: string }>(
      "/v1/account/mfa/setup",
      {}
    ),

  mfaConfirm: (totpCode: string) =>
    client.post<{ success: boolean; data?: { backupCodes: string[] }; error?: string }>(
      "/v1/account/mfa/confirm",
      { totpCode }
    ),

  mfaDisable: (body: { totpCode?: string; backupCode?: string }) =>
    client.delete<{ success: boolean; data?: { disabled: boolean }; error?: string }>("/v1/account/mfa", body),

  mfaBackupCodes: () =>
    client.get<{
      success: boolean;
      data?: { codes: { id: string; createdAt: string; usedAt: string | null }[] };
      error?: string;
    }>("/v1/account/mfa/backup-codes"),

  mfaRegenerateBackup: (totpCode: string) =>
    client.post<{ success: boolean; data?: { backupCodes: string[] }; error?: string }>(
      "/v1/account/mfa/backup-codes/regenerate",
      { totpCode }
    ),
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

/** Shopflow module API (same session cookie). Used for in-app notifications from Hub when Shopflow is enabled. */
export type InAppNotificationDto = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  type: string;
  status: string;
  data?: Record<string, unknown> | null;
};

export const shopflowNotificationsApi = {
  list: (userId: string) =>
    client.get<{
      success: boolean;
      data?: {
        notifications: InAppNotificationDto[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
      };
      error?: string;
    }>(
      `/v1/shopflow/notifications?userId=${encodeURIComponent(userId)}&limit=50&page=1`
    ),

  unreadCount: (userId: string) =>
    client.get<{ success: boolean; data?: { count: number }; error?: string }>(
      `/v1/shopflow/notifications/unread-count?userId=${encodeURIComponent(userId)}`
    ),

  markRead: (id: string, userId: string) =>
    client.put<{ success: boolean; error?: string }>(`/v1/shopflow/notifications/${id}/read`, {
      userId,
    }),

  markAllRead: (userId: string) =>
    client.put<{ success: boolean; data?: { count: number }; error?: string }>(
      `/v1/shopflow/notifications/read-all`,
      { userId }
    ),

  getPreferences: (userId: string) =>
    client.get<{
      success: boolean;
      data?: {
        id: string;
        userId: string;
        inAppEnabled: boolean;
        pushEnabled: boolean;
        emailEnabled: boolean;
        preferences?: Record<string, { inApp?: boolean; push?: boolean; email?: boolean }> | null;
      };
      error?: string;
    }>(`/v1/shopflow/users/${userId}/notification-preferences`),

  updatePreferences: (
    userId: string,
    body: {
      inAppEnabled?: boolean;
      pushEnabled?: boolean;
      emailEnabled?: boolean;
      preferences?: Record<string, { inApp?: boolean; push?: boolean; email?: boolean }>;
    }
  ) =>
    client.put<{
      success: boolean;
      data?: {
        id: string;
        userId: string;
        inAppEnabled: boolean;
        pushEnabled: boolean;
        emailEnabled: boolean;
        preferences?: Record<string, { inApp?: boolean; push?: boolean; email?: boolean }> | null;
      };
      error?: string;
    }>(`/v1/shopflow/users/${userId}/notification-preferences`, body),
};

export const shopflowStoresApi = {
  list: () =>
    client.get<{ success: boolean; data?: { id: string; name: string; active?: boolean }[]; error?: string }>(
      `/v1/shopflow/stores`
    ),
};
