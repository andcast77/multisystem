import { useQuery } from "@tanstack/react-query";
import { companyApi } from "@/lib/api-client";

export function useCompany(companyId: string | undefined) {
  return useQuery({
    queryKey: ["company", companyId],
    queryFn: async () => {
      if (!companyId) throw new Error("Company ID is required");
      const response = await companyApi.getCompany(companyId);
      if (!response.success || !response.data) {
        throw new Error(response.error || "Failed to fetch company");
      }
      return response.data;
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
