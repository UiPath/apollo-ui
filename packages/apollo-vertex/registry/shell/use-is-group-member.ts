import { useQuery } from "@tanstack/react-query";
import { useSolution } from "@uipath/vs-core";
import { useAuth } from "./shell-auth-provider";

export interface UseIsGroupMemberOptions {
  groupIds: string[];
  externalGroupNames?: string[];
}

export interface UseIsGroupMemberResult {
  isMember: boolean;
  isLoading: boolean;
}

export const useIsGroupMember = ({
  groupIds,
  externalGroupNames = [],
}: UseIsGroupMemberOptions): UseIsGroupMemberResult => {
  const { user } = useAuth();
  const solution = useSolution();
  const identity = solution?.api.identity;
  const userId = user?.sub;

  const { data: localData, isLoading: localLoading } = useQuery({
    queryKey: ["identity-group-membership", userId, groupIds.toSorted()],
    queryFn: (): Promise<Record<string, boolean>> =>
      identity != null && userId != null
        ? identity.checkGroupMembership(userId, groupIds)
        : Promise.resolve({}),
    enabled: userId != null && groupIds.length > 0,
  });

  const { data: externalData, isLoading: externalLoading } = useQuery({
    queryKey: [
      "identity-external-group-membership",
      userId,
      externalGroupNames.toSorted(),
    ],
    queryFn: (): Promise<Record<string, boolean>> =>
      identity != null && userId != null
        ? identity.checkExternalGroupMembership(userId, externalGroupNames)
        : Promise.resolve({}),
    enabled: userId != null && externalGroupNames.length > 0,
  });

  const isMember =
    groupIds.some((id) => localData?.[id]) ||
    externalGroupNames.some((name) => externalData?.[name]);

  return { isMember, isLoading: localLoading || externalLoading };
};
