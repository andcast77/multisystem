import { useQuery } from "@tanstack/react-query";
import { companyApi } from "@/lib/api-client";

export function useCompanyMembers(companyId: string | undefined) {
  return useQuery({
    queryKey: ["companyMembers", companyId],
    queryFn: async () => {
      if (!companyId) throw new Error("Company ID is required");
      const response = await companyApi.getCompanyMembers(companyId);
      if (!response.success || !response.data) {
        throw new Error(response.error || "Failed to fetch company members");
      }
      return response.data;
    },
    enabled: !!companyId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
