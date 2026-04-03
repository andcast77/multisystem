import { useQuery } from "@tanstack/react-query";
import { companyApi } from "@/lib/api-client";
import { useSSEMetrics } from "./useSSEMetrics";

export function useCompanyStats(companyId: string | undefined) {
  const { connected, fallbackToPolling } = useSSEMetrics(companyId);

  return useQuery({
    queryKey: ["companyStats", companyId],
    queryFn: async () => {
      if (!companyId) throw new Error("Company ID is required");
      const response = await companyApi.getCompanyStats(companyId);
      if (!response.success || !response.data) {
        throw new Error(response.error || "Failed to fetch company stats");
      }
      return response.data;
    },
    enabled: !!companyId,
    // When SSE is connected, invalidation is explicit — no polling needed.
    // Fall back to 2-minute stale time when SSE is unavailable or after max reconnects.
    staleTime: connected && !fallbackToPolling ? Infinity : 2 * 60 * 1000,
    refetchInterval: fallbackToPolling ? 2 * 60 * 1000 : false,
  });
}
