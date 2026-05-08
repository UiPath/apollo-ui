import { useSuspenseQuery } from "@tanstack/react-query";
import { fetchGroupIdByName } from "@/lib/identity-service";
import { useAuth } from "./shell-auth-provider";
import { STALE_TIME_MS } from "./shell-constants";

export interface UseGroupIdOptions<Role extends string> {
  role: Role;
  roleGroupMap: Record<Role, string>;
  baseUrl: string;
  orgName: string;
  orgId: string;
}

export const useGroupId = <Role extends string>({
  role,
  roleGroupMap,
  baseUrl,
  orgName,
  orgId,
}: UseGroupIdOptions<Role>): string => {
  const { accessToken } = useAuth();
  const groupName = roleGroupMap[role];

  const { data } = useSuspenseQuery({
    queryKey: ["identity", "group-id-by-name", orgId, groupName],
    queryFn: () => {
      if (accessToken == null) {
        throw new Error("accessToken is required");
      }
      return fetchGroupIdByName(accessToken, {
        baseUrl,
        orgName,
        orgId,
        groupName,
      });
    },
    staleTime: STALE_TIME_MS,
  });

  return data;
};
