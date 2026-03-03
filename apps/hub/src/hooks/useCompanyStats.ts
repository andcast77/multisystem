import { useQuery } from "@tanstack/react-query";
import { companyApi } from "@/lib/api-client";

export function useCompanyStats(companyId: string | undefined) {
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
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
