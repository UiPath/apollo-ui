"use client";

import { Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

interface AiChatLoadingProps {
  assistantName?: string;
}

export function AiChatLoading({ assistantName }: AiChatLoadingProps) {
  const { t } = useTranslation();
  const displayName = assistantName ?? t("ai_assistant");

  return (
    <div className="flex justify-start gap-3">
      <div className="size-8 flex items-center justify-center flex-shrink-0 rounded-full bg-primary">
        <Sparkles className="size-4 text-primary-foreground" />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground font-medium">
          {displayName}
        </span>
        <div className="px-4 py-3 rounded-lg bg-primary/10">
          <div className="flex gap-1">
            <span className="size-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
            <span className="size-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
            <span className="size-2 bg-primary rounded-full animate-bounce" />
          </div>
        </div>
      </div>
    </div>
  );
}
