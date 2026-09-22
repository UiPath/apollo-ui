import { useQuery } from "@tanstack/react-query";
import { useSolution } from "@uipath/vs-core";
import { useAuth } from "./shell-auth-provider";

export interface UseIsGroupMemberOptions {
  groupIds: string[];
}

export interface UseIsGroupMemberResult {
  isMember: boolean;
  isLoading: boolean;
}

export const useIsGroupMember = ({
  groupIds,
}: UseIsGroupMemberOptions): UseIsGroupMemberResult => {
  const { user } = useAuth();
  const solution = useSolution();
  const checkGroupMembership = solution?.api.identity.checkGroupMembership;
  const userId = user?.sub;

  const { data, isLoading } = useQuery({
    queryKey: ["identity-group-membership", userId, groupIds.toSorted()],
    queryFn: (): Promise<Record<string, boolean>> =>
      checkGroupMembership != null && userId != null
        ? checkGroupMembership(userId, groupIds)
        : Promise.resolve({}),
    enabled: userId != null && groupIds.length > 0,
  });

  const isMember = data ? groupIds.some((id) => data[id]) : false;

  return { isMember, isLoading };
};
