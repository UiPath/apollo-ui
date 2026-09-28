"use client";

import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AutopilotInsightProps {
  onClose: () => void;
  sourceCardTitle: string;
}

export function AutopilotInsight({
  onClose,
  sourceCardTitle,
}: AutopilotInsightProps) {
  const { t } = useTranslation();

  return (
    <Card
      variant="glass"
      className="!bg-white/90 dark:!bg-card h-full overflow-hidden relative"
    >
      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        aria-label={t("close")}
        className="absolute top-5 right-5 z-20 size-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-4"
          aria-hidden="true"
        >
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      </button>

      <CardHeader className="!gap-2">
        <div className="flex items-center gap-2">
          <img
            src="/Autopilot_dark.svg"
            alt=""
            className="size-5 block dark:hidden"
          />
          <img
            src="/Autopilot_light.svg"
            alt=""
            className="size-5 hidden dark:block"
          />
          <CardTitle className="text-sm font-bold tracking-tight">
            {t("autopilot_insight")}
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground">
          {t("autopilot_insight_analyzing", { source: sourceCardTitle })}
        </p>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        {/* Placeholder for future chat UX responses */}
        <div className="flex-1 border border-dashed border-muted-foreground/15 bg-muted/30 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-muted-foreground/60">
              {t("autopilot_response_area")}
            </p>
            <p className="text-xs text-muted-foreground/40 mt-1">
              {t("autopilot_response_placeholder")}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
