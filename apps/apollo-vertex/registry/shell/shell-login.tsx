"use client";

import { useTranslation } from "react-i18next";
import { useAuth } from "./shell-auth-provider";

export const ShellLogin = () => {
  const { t } = useTranslation();
  const { login } = useAuth();

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-lg shadow-lg p-8 border border-border">
          <div className="space-y-6">
            <button
              type="button"
              onClick={() => login()}
              className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium text-base shadow-sm hover:shadow-md"
            >
              {t("sign_in_with_uipath")}
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>{t("need_help")}</p>
        </div>
      </div>
    </div>
  );
};
