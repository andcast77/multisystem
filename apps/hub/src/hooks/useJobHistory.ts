import { useQuery } from "@tanstack/react-query";
import { jobsApi } from "@/lib/api-client";

export function useJobHistory(limit = 50) {
  return useQuery({
    queryKey: ["jobHistory", limit],
    queryFn: async () => {
      const response = await jobsApi.getHistory(limit);
      if (!response.success || !response.data) {
        throw new Error((response as { error?: string }).error || "Failed to fetch job history");
      }
      return response.data;
    },
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });
}
