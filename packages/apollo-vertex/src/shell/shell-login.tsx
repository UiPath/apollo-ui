import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useAuth } from "./shell-auth-provider";

export interface ShellLoginProps {
  title?: string;
  description?: string;
}

export const ShellLogin = ({ title, description }: ShellLoginProps) => {
  const { t } = useTranslation();
  const { login } = useAuth();

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-lg shadow-lg p-8 border border-border">
          {/* oxlint-disable-next-line typescript-eslint(prefer-nullish-coalescing) -- empty string should not render the header */}
          {(title || description) && (
            <div className="text-center mb-8">
              {title && (
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  {title}
                </h1>
              )}
              {description && (
                <p className="text-muted-foreground">{description}</p>
              )}
            </div>
          )}
          <div className="space-y-6">
            <Button size="lg" onClick={() => void login()} className="w-full">
              {t("sign_in_with_uipath")}
            </Button>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>{t("need_help")}</p>
        </div>
      </div>
    </div>
  );
};
