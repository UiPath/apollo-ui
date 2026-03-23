"use client";

import type { ReactNode } from "react";
import type { TextPart, UIMessage } from "@tanstack/ai-client";
import { Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AiChatMarkdown } from "./ai-chat-markdown";

interface AiChatMessageProps {
  message: UIMessage;
  assistantName?: string;
  children?: ReactNode;
}

function getDisplayText(message: UIMessage): string {
  return message.parts
    .filter((p): p is TextPart => p.type === "text")
    .map((p) => p.content)
    .join("");
}

export function AiChatMessage({
  message,
  assistantName,
  children,
}: AiChatMessageProps) {
  const { t } = useTranslation();
  const isUser = message.role === "user";
  const displayName = assistantName ?? t("ai_assistant");
  const displayContent = getDisplayText(message);

  if (isUser) {
    return (
      <div className="flex w-full justify-end">
        <div className="max-w-[80%] px-4 py-3 text-sm rounded-lg border border-border bg-muted/50">
          {displayContent && (
            <p className="whitespace-pre-wrap">{displayContent}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full justify-start gap-3">
      <div className="size-8 flex items-center justify-center flex-shrink-0 rounded-full bg-primary">
        <Sparkles
          className="size-4 text-primary-foreground"
          aria-hidden="true"
        />
      </div>
      <div className="flex flex-col gap-1 w-[85%]">
        <span className="text-xs text-muted-foreground font-medium">
          {displayName}
        </span>
        {displayContent && <AiChatMarkdown>{displayContent}</AiChatMarkdown>}
        {children && <div className="mt-2 flex flex-col gap-2">{children}</div>}
      </div>
    </div>
  );
}
