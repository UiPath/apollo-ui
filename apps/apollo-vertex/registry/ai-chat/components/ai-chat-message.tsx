"use client";

import type { UIMessage } from "@tanstack/ai-client";
import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { AiChatMarkdown } from "./ai-chat-markdown";

interface AiChatMessageProps {
  message: UIMessage;
  assistantName?: string;
  children?: ReactNode;
}

export function AiChatMessage({
  message,
  assistantName,
  children,
}: AiChatMessageProps) {
  const { t } = useTranslation();
  const isUser = message.role === "user";
  const displayName = assistantName ?? t("ai_assistant");

  const hasToolOutputs = message.parts.some(
    (p) => p.type === "tool-call" && p.output != null,
  );
  const hasContent =
    hasToolOutputs || message.parts.some((p) => p.type === "text" && p.content);

  if (!isUser && !hasContent) {
    return null;
  }

  const text = message.parts
    .filter((p) => p.type === "text")
    .map((p) => p.content)
    .join("");

  if (isUser) {
    return (
      <div className="flex w-full justify-end">
        <div className="max-w-[80%] px-4 py-3 text-sm rounded-lg border border-border bg-muted/50">
          {text && <p className="whitespace-pre-wrap">{text}</p>}
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
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <span className="text-xs text-muted-foreground font-medium">
          {displayName}
        </span>
        {text && (
          <div className="max-w-[85%] w-fit">
            <AiChatMarkdown>{text}</AiChatMarkdown>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
