import { useLiveQuery } from "@tanstack/react-db";
import { type GroupMember, useSolution } from "@uipath/vs-core";
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

  const { data, isLoading } = useLiveQuery<GroupMember>((q) =>
    q.from({ members: solution?.api.collections.identity.groupMembers }),
  );

  if (!user) {
    return { isMember: false, isLoading };
  }

  const userEmail = user.email.toLowerCase();
  const isMember = (data ?? []).some(
    (member) =>
      groupIds.includes(member.groupId) &&
      member.email.toLowerCase() === userEmail,
  );

  return { isMember, isLoading };
};
