"use client";

import type { TextPart, UIMessage } from "@tanstack/ai-client";
import { Sparkles, User } from "lucide-react";
import type { ReactNode } from "react";
import { Avatar, AvatarFallback } from "@/registry/avatar/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/registry/tooltip/tooltip";
import type { MessageFeedbackType } from "../types";
import { AiChatMarkdown } from "./ai-chat-markdown";
import { AiChatMessageActions } from "./ai-chat-message-actions";
import { useAiChat } from "./ai-chat-provider";

interface AiChatMessageProps {
  message: UIMessage;
  assistantName?: string;
  children?: ReactNode;
  /** Whether this message is currently being streamed */
  isStreaming?: boolean;
  /** Hide avatar and name (for grouped consecutive messages) */
  isGrouped?: boolean;
  /** Callbacks for message actions */
  onFeedback?: (type: MessageFeedbackType) => void;
  onRegenerate?: () => void;
  onEdit?: () => void;
}

function getDisplayText(message: UIMessage): string {
  return message.parts
    .filter((p): p is TextPart => p.type === "text")
    .map((p) => p.content)
    .join("");
}

function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

function formatFullDateTime(date: Date): string {
  return date.toLocaleString(navigator.language, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function AiChatMessage({
  message,
  assistantName,
  children,
  isStreaming = false,
  isGrouped = false,
  onFeedback,
  onRegenerate,
  onEdit,
}: AiChatMessageProps) {
  const config = useAiChat();
  const isUser = message.role === "user";
  const displayName = assistantName ?? config.assistantName;
  const displayContent = getDisplayText(message);

  if (!isUser && !displayContent && !children) {
    return null;
  }

  const timestamp = message.createdAt ? new Date(message.createdAt) : null;

  if (isUser) {
    return (
      <div className="group/message flex w-full justify-end gap-3">
        <div className="flex flex-col items-end gap-1 max-w-[80%]">
          <div className="px-4 py-3 text-sm rounded-2xl rounded-br-md bg-ai-chat-bubble-user text-ai-chat-bubble-user-foreground">
            {displayContent && (
              <p className="whitespace-pre-wrap">{displayContent}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {config.showTimestamps && timestamp && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-xs text-ai-chat-muted-foreground cursor-default">
                    {formatRelativeTime(timestamp)}
                  </span>
                </TooltipTrigger>
                <TooltipContent>{formatFullDateTime(timestamp)}</TooltipContent>
              </Tooltip>
            )}
            {config.showMessageActions && (
              <AiChatMessageActions
                content={displayContent}
                messageRole="user"
                showCopy={config.showCopyButton}
                onEdit={onEdit}
              />
            )}
          </div>
        </div>
        {!isGrouped && (
          <Avatar className="size-8 flex-shrink-0">
            <AvatarFallback className="bg-ai-chat-muted">
              {config.userAvatar ?? (
                <User
                  className="size-4 text-ai-chat-muted-foreground"
                  aria-hidden="true"
                />
              )}
            </AvatarFallback>
          </Avatar>
        )}
        {isGrouped && <div className="size-8 flex-shrink-0" />}
      </div>
    );
  }

  return (
    <div className="group/message flex w-full justify-start gap-3">
      {isGrouped ? (
        <div className="size-8 flex-shrink-0" />
      ) : (
        <Avatar className="size-8 flex-shrink-0">
          <AvatarFallback className="bg-ai-chat-accent">
            {config.assistantAvatar ?? (
              <Sparkles
                className="size-4 text-ai-chat-accent-foreground"
                aria-hidden="true"
              />
            )}
          </AvatarFallback>
        </Avatar>
      )}
      <div className="flex flex-col gap-1 max-w-[85%]">
        {!isGrouped && (
          <span className="text-xs text-ai-chat-muted-foreground font-medium">
            {displayName}
          </span>
        )}
        {displayContent && (
          <div>
            <AiChatMarkdown>{displayContent}</AiChatMarkdown>
            {isStreaming && (
              <span className="inline-block w-0.5 h-4 ml-0.5 bg-ai-chat-foreground animate-pulse align-text-bottom" />
            )}
          </div>
        )}
        {children && <div className="mt-2 flex flex-col gap-2">{children}</div>}
        <div className="flex items-center gap-2">
          {config.showTimestamps && timestamp && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-xs text-ai-chat-muted-foreground cursor-default">
                  {formatRelativeTime(timestamp)}
                </span>
              </TooltipTrigger>
              <TooltipContent>{formatFullDateTime(timestamp)}</TooltipContent>
            </Tooltip>
          )}
          {config.showMessageActions && (
            <AiChatMessageActions
              content={displayContent}
              messageRole="assistant"
              showCopy={config.showCopyButton}
              onFeedback={onFeedback}
              onRegenerate={onRegenerate}
            />
          )}
        </div>
      </div>
    </div>
  );
}
