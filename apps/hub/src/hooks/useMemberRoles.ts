import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { companyApi } from "@/lib/api-client";

export function useMemberRoles(companyId: string | undefined, memberId: string | undefined) {
  return useQuery({
    queryKey: ["memberRoles", companyId, memberId],
    queryFn: async () => {
      if (!companyId || !memberId) throw new Error("IDs required");
      const response = await companyApi.getMemberRoles(companyId, memberId);
      if (!response.success || !response.data) {
        throw new Error(response.error || "Failed to fetch member roles");
      }
      return response.data;
    },
    enabled: !!companyId && !!memberId,
    staleTime: 60 * 1000,
  });
}

export function useUpdateMemberRoles(companyId: string, memberId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (roleIds: string[]) =>
      companyApi.updateMemberRoles(companyId, memberId, roleIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memberRoles", companyId, memberId] });
    },
  });
}
