"use client";

import type { TextPart, UIMessage } from "@tanstack/ai-client";
import type { ReactNode } from "react";
import type { MessageFeedbackType } from "../types";
import { AiChatMarkdown } from "./ai-chat-markdown";
import { AiChatMessageActions } from "./ai-chat-message-actions";
import { useAiChat } from "./ai-chat-provider";

interface AiChatMessageProps {
  message: UIMessage;
  children?: ReactNode;
  /** Whether this message is currently being streamed */
  isStreaming?: boolean;
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

export function AiChatMessage({
  message,
  children,
  isStreaming = false,
  onFeedback,
  onRegenerate,
  onEdit,
}: AiChatMessageProps) {
  const config = useAiChat();
  const isUser = message.role === "user";
  const displayContent = getDisplayText(message);

  if (!isUser && !displayContent && !children) {
    return null;
  }

  if (isUser) {
    return (
      <div className="group/message flex w-full justify-end">
        <div className="flex flex-col items-end gap-1 max-w-[80%]">
          <div className="px-4 py-3 text-sm rounded-2xl rounded-br-md bg-ai-chat-bubble-user text-ai-chat-bubble-user-foreground">
            {displayContent && (
              <p className="whitespace-pre-wrap">{displayContent}</p>
            )}
          </div>
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
    );
  }

  return (
    <div className="group/message flex w-full justify-start">
      <div className="flex flex-col gap-1 max-w-[85%]">
        {displayContent && (
          <div>
            <AiChatMarkdown>{displayContent}</AiChatMarkdown>
            {isStreaming && (
              <span className="inline-block w-0.5 h-4 ml-0.5 bg-ai-chat-foreground animate-pulse align-text-bottom" />
            )}
          </div>
        )}
        {children && <div className="mt-2 flex flex-col gap-2">{children}</div>}
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
  );
}
