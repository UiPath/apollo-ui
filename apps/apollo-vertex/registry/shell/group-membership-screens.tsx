import { ShieldX } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import type { UserInfo } from "./shell-auth-provider";

export const VerifyingMembership = () => {
  const { t } = useTranslation();
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="text-muted-foreground">{t("verifying_access")}</div>
    </div>
  );
};

export interface MembershipDeniedProps {
  user: UserInfo;
  onLogout: () => void;
  description?: string;
}

export const MembershipDenied = ({
  user,
  onLogout,
  description,
}: MembershipDeniedProps) => {
  const { t } = useTranslation();
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-lg shadow-lg p-8 border border-border text-center">
          <ShieldX className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {t("access_denied")}
          </h1>
          <p className="text-muted-foreground mb-6">
            {description ?? t("access_denied_description")}
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            {t("signed_in_as", { email: user.email })}
          </p>
          <Button className="w-full" onClick={onLogout}>
            {t("sign_out")}
          </Button>
        </div>
      </div>
    </div>
  );
};
