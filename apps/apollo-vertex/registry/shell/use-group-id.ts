import { useLiveQuery } from "@tanstack/react-db";
import { type Group, useSolution } from "@uipath/vs-core";

export interface UseGroupIdOptions<Role extends string> {
  role: Role;
  roleGroupMap: Record<Role, string>;
}

export interface UseGroupIdResult {
  groupId: string | null;
  isLoading: boolean;
}

export const useGroupId = <Role extends string>({
  role,
  roleGroupMap,
}: UseGroupIdOptions<Role>): UseGroupIdResult => {
  const solution = useSolution();
  const groupName = roleGroupMap[role];

  const { data, isLoading } = useLiveQuery<Group>((q) =>
    q.from({ groups: solution?.api.collections.identity.groups }),
  );

  const group = data?.find((g) => g.name === groupName);
  return { groupId: group?.id ?? null, isLoading };
};
