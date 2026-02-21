import { useQuery } from "@tanstack/react-query";
import { authApi } from "@/lib/api-client";

export function useCompanies(enabled: boolean = true) {
  return useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      const response = await authApi.companies();
      if (!response.success || !response.data) {
        throw new Error(response.error || "Failed to fetch companies");
      }
      return response.data;
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
