import { eq, useLiveQuery } from "@tanstack/react-db";
import { type GroupMember, useSolution } from "@uipath/vs-core";

export interface UseGroupMembersOptions {
  groupId: string;
}

export interface UseGroupMembersResult {
  users: GroupMember[];
  isLoading: boolean;
}

export const useGroupMembers = ({
  groupId,
}: UseGroupMembersOptions): UseGroupMembersResult => {
  const solution = useSolution();

  const { data, isLoading } = useLiveQuery<GroupMember>((q) =>
    q
      .from({ members: solution?.api.collections.identity.groupMembers })
      .where(({ members }) => eq(members.groupId, groupId)),
  );

  return { users: data ?? [], isLoading };
};
