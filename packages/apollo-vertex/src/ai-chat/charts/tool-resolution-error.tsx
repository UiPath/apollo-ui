"use client";

import { AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ToolResolutionFailure } from "../tools/data-fabric/util/resolver-result";

export interface ToolResolutionErrorProps {
  failure: ToolResolutionFailure;
}

export function ToolResolutionError({ failure }: ToolResolutionErrorProps) {
  const { t } = useTranslation();
  const { reason, ...params } = failure;
  return (
    <div
      role="alert"
      className="w-fit max-w-[85%] rounded-lg border border-amber-300/60 bg-amber-50/40 p-3 text-sm dark:border-amber-700/50 dark:bg-amber-950/20"
    >
      <div className="flex items-start gap-2">
        <AlertTriangle
          className="size-4 mt-0.5 flex-shrink-0 text-amber-600 dark:text-amber-400"
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1 space-y-1">
          <p className="font-medium">{t("chart_render_failed_title")}</p>
          <p className="text-muted-foreground">{t(reason, params)}</p>
        </div>
      </div>
    </div>
  );
}
