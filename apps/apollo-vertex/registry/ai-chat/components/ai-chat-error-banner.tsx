"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

interface AiChatErrorBannerProps {
  message: string;
  onRetry?: () => void;
}

export function AiChatErrorBanner({
  message,
  onRetry,
}: AiChatErrorBannerProps) {
  const { t } = useTranslation();
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="relative z-0 mx-4 -mb-6 flex items-center gap-2 rounded-t-lg bg-destructive/10 px-6 pt-3 pb-6 text-sm text-destructive"
    >
      <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
      <span className="flex-1 break-words">{message}</span>
      {onRetry && (
        <Button
          type="button"
          variant="link"
          size="sm"
          onClick={onRetry}
          className="shrink-0 h-auto p-0 text-xs font-medium text-destructive"
          aria-label={t("retry")}
        >
          <RefreshCw className="size-3" aria-hidden="true" />
          {t("retry")}
        </Button>
      )}
    </div>
  );
}
