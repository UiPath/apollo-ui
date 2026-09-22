import type { PropsWithChildren } from "react";
import { useAuth } from "./shell-auth-provider";
import {
  MembershipDenied,
  VerifyingMembership,
} from "./group-membership-screens";
import { useIsGroupMember } from "./use-is-group-member";

export interface GroupMembershipGuardProps {
  groupIds: string[];
  deniedDescription?: string;
}

export const GroupMembershipGuard = ({
  groupIds,
  deniedDescription,
  children,
}: PropsWithChildren<GroupMembershipGuardProps>) => {
  const { isAuthenticated, user, logout } = useAuth();
  const { isMember, isLoading } = useIsGroupMember({ groupIds });

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
