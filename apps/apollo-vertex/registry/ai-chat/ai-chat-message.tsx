"use client";

import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/lib/ai-chat-types";

interface AiChatMessageProps {
  message: ChatMessage;
  renderToolCall?: (toolCall: ChatMessage["toolCalls"]) => ReactNode;
  assistantName?: string;
}

export function AiChatMessage({
  message,
  renderToolCall,
  assistantName,
}: AiChatMessageProps) {
  const { t } = useTranslation();
  const isUser = message.role === "user";
  const displayName = assistantName ?? t("ai_assistant");

  if (isUser) {
    return (
      <div className="flex w-full justify-end">
        <div className="max-w-[80%] px-4 py-3 text-sm rounded-lg border border-border bg-muted/50">
          {message.content && (
            <p className="whitespace-pre-wrap">{message.content}</p>
          )}
          {message.attachments && message.attachments.length > 0 && (
            <div
              className={cn("flex flex-col gap-1", message.content && "mt-2")}
            >
              {message.attachments.map((attachment, index) => (
                <p key={index} className="text-xs text-muted-foreground">
                  📎 {attachment.fileName}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full justify-start gap-3">
      <div className="size-8 flex items-center justify-center flex-shrink-0 rounded-full bg-primary">
        <Sparkles className="size-4 text-primary-foreground" />
      </div>
      <div className="flex flex-col gap-1 w-[85%]">
        <span className="text-xs text-muted-foreground font-medium">
          {displayName}
        </span>
        {message.content && (
          <div className="px-4 py-3 text-sm rounded-lg bg-primary/10">
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
        )}
        {message.toolCalls && renderToolCall && (
          <div className="mt-2">{renderToolCall(message.toolCalls)}</div>
        )}
      </div>
    </div>
  );
}
