import { ShieldX } from "lucide-react";
import { type PropsWithChildren, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useAuth } from "./shell-auth-provider";
import { useGroupMembers } from "./use-group-members";

export interface GroupMembershipGuardProps {
  baseUrl: string;
  orgName: string;
  orgId: string;
  groupId: string;
  deniedDescription?: string;
}

export const GroupMembershipGuard = ({
  baseUrl,
  orgName,
  orgId,
  groupId,
  deniedDescription,
  children,
}: PropsWithChildren<GroupMembershipGuardProps>) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <VerifyingMembership />;
  }

  return (
    <Suspense fallback={<VerifyingMembership />}>
      <GroupMembershipGuardContent
        baseUrl={baseUrl}
        orgName={orgName}
        orgId={orgId}
        groupId={groupId}
        deniedDescription={deniedDescription}
      >
        {children}
      </GroupMembershipGuardContent>
    </Suspense>
  );
};

const GroupMembershipGuardContent = ({
  baseUrl,
  orgName,
  orgId,
  groupId,
  deniedDescription,
  children,
}: PropsWithChildren<GroupMembershipGuardProps>) => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { users } = useGroupMembers({ baseUrl, orgName, orgId, groupId });

  if (!user) {
    return <VerifyingMembership />;
  }

  const isUserInGroup = users.some(
    (member) => member.email.toLowerCase() === user.email.toLowerCase(),
  );

  if (!isUserInGroup) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-lg shadow-lg p-8 border border-border text-center">
            <ShieldX className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {t("access_denied")}
            </h1>
            <p className="text-muted-foreground mb-6">
              {deniedDescription ?? t("access_denied_description")}
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              {t("signed_in_as", { email: user.email })}
            </p>
            <Button className="w-full" onClick={() => logout()}>
              {t("sign_out")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

const VerifyingMembership = () => {
  const { t } = useTranslation();
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="text-muted-foreground">{t("verifying_access")}</div>
    </div>
  );
};
