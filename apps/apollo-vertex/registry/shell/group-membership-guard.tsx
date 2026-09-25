import type { PropsWithChildren } from "react";
import { useAuth } from "./shell-auth-provider";
import {
  MembershipDenied,
  VerifyingMembership,
} from "./group-membership-screens";
import { useIsGroupMember } from "./use-is-group-member";

export interface GroupMembershipGuardProps {
  groupIds: string[];
  externalGroupNames?: string[];
  deniedDescription?: string;
}

export const GroupMembershipGuard = ({
  groupIds,
  externalGroupNames,
  deniedDescription,
  children,
}: PropsWithChildren<GroupMembershipGuardProps>) => {
  const { isAuthenticated, user, logout } = useAuth();
  const { isMember, isLoading } = useIsGroupMember({
    groupIds,
    externalGroupNames,
  });

  if (!isAuthenticated || isLoading || !user) {
    return <VerifyingMembership />;
  }

  if (!isMember) {
    return (
      <MembershipDenied
        user={user}
        onLogout={logout}
        description={deniedDescription}
      />
    );
  }

  return children;
};
