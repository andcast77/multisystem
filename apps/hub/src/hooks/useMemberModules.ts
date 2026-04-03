import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { companyApi } from "@/lib/api-client";

export function useMemberModules(companyId: string | undefined, memberId: string | undefined) {
  return useQuery({
    queryKey: ["memberModules", companyId, memberId],
    queryFn: async () => {
      if (!companyId || !memberId) throw new Error("IDs required");
      const response = await companyApi.getMemberModules(companyId, memberId);
      if (!response.success || !response.data) {
        throw new Error(response.error || "Failed to fetch member modules");
      }
      return response.data;
    },
    enabled: !!companyId && !!memberId,
    staleTime: 60 * 1000,
  });
}

export function useUpdateMemberModules(companyId: string, memberId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (modules: { moduleId: string; enabled: boolean }[]) =>
      companyApi.updateMemberModules(companyId, memberId, modules),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memberModules", companyId, memberId] });
    },
  });
}
