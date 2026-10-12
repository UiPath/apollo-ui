"use client";

import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

interface AiChatEmptyStateProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
}

export function AiChatEmptyState({
  title,
  description,
  icon,
}: AiChatEmptyStateProps) {
  const { t } = useTranslation();
  const displayTitle = title ?? t("how_can_i_help_you");
  return (
    <div className="flex flex-col items-center justify-center h-full text-center text-ai-chat-muted-foreground gap-4">
      {icon}
      <div className="flex flex-col items-center gap-1">
        <h2 className="text-2xl font-semibold leading-tight tracking-tight text-foreground">
          {displayTitle}
        </h2>
        {description && (
          <p className="text-sm text-muted-foreground max-w-sm">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
