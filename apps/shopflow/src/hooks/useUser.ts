import { useQuery } from "@tanstack/react-query";
import { authApi } from "@/lib/api-client";

export function useUser() {
  return useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const response = await authApi.me();
      if (!response.success || !response.data) {
        throw new Error(response.error || "Failed to fetch user");
      }
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });
}
