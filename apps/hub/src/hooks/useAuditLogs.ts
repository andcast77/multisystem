import { useQuery } from "@tanstack/react-query";
import { auditLogApi, type AuditLogFilters } from "@/lib/api-client";

export function useAuditLogs(filters: AuditLogFilters = {}) {
  return useQuery({
    queryKey: ["auditLogs", filters],
    queryFn: async () => {
      const response = await auditLogApi.list(filters);
      if (!response.success || !response.data) {
        throw new Error((response as { error?: string }).error || "Failed to fetch audit logs");
      }
      return response.data;
    },
    staleTime: 30 * 1000,
  });
}
