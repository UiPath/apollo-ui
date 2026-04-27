import { useSuspenseQueries } from "@tanstack/react-query";
import { useAuth } from "./shell-auth-provider";
import { groupMembersQueryOptions } from "./use-group-members";

export interface UseIsGroupMemberOptions {
  baseUrl: string;
  orgName: string;
  orgId: string;
  groupIds: string[];
}

export const useIsGroupMember = ({
  baseUrl,
  orgName,
  orgId,
  groupIds,
}: UseIsGroupMemberOptions): boolean => {
  const { user, accessToken } = useAuth();

  const results = useSuspenseQueries({
    queries: groupIds.map((groupId) =>
      groupMembersQueryOptions(accessToken, {
        baseUrl,
        orgName,
        orgId,
        groupId,
      }),
    ),
  });

  if (!user) {
    return false;
  }

  const userEmail = user.email.toLowerCase();
  return results.some((result) =>
    result.data.some((member) => member.email.toLowerCase() === userEmail),
  );
};
