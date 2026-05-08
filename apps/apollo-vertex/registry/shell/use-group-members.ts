import { useSuspenseQuery } from "@tanstack/react-query";
import {
  fetchGroupMembers,
  type FetchGroupMembersOptions,
} from "@/lib/identity-service";
import { useAuth } from "./shell-auth-provider";
import { STALE_TIME_MS } from "./shell-constants";

export const groupMembersQueryOptions = (
  accessToken: string | null,
  options: FetchGroupMembersOptions,
) => ({
  queryKey: [
    "identity",
    "group-members",
    options.baseUrl,
    options.orgName,
    options.orgId,
    options.groupId,
  ],
  queryFn: () => {
    if (accessToken == null) {
      throw new Error("accessToken is required");
    }
    return fetchGroupMembers(accessToken, options);
  },
  staleTime: STALE_TIME_MS,
});

export const useGroupMembers = (options: FetchGroupMembersOptions) => {
  const { accessToken } = useAuth();
  const { data: users } = useSuspenseQuery(
    groupMembersQueryOptions(accessToken, options),
  );

  return { users };
};
