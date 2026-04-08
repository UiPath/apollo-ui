"use client";

import {
  Check,
  Copy,
  Pencil,
  RefreshCw,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/registry/tooltip/tooltip";
import type { MessageFeedbackType } from "../types";

const LABELS = {
  copy: "Copy",
  copied: "Copied!",
  helpful: "Good response",
  notHelpful: "Bad response",
  regenerate: "Try again",
  edit: "Edit",
} as const;

interface AiChatMessageActionsProps {
  content: string;
  messageRole: "user" | "assistant";
  showCopy?: boolean;
  onFeedback?: (type: MessageFeedbackType) => void;
  onRegenerate?: () => void;
  onEdit?: () => void;
}

export function AiChatMessageActions({
  content,
  messageRole,
  showCopy = true,
  onFeedback,
  onRegenerate,
  onEdit,
}: AiChatMessageActionsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyLabel = copied ? LABELS.copied : LABELS.copy;

  return (
    <div className={`flex items-center gap-0.5 -ml-[7px] transition-opacity ${messageRole === "assistant" ? "opacity-100" : "opacity-0 group-hover/message:opacity-100"}`}>
      {showCopy && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={handleCopy}
              className="size-7 inline-flex items-center justify-center rounded-md hover:bg-ai-chat-muted transition-colors"
              aria-label={copyLabel}
            >
              {copied ? (
                <Check className="size-3.5 text-success" aria-hidden="true" />
              ) : (
                <Copy
                  className="size-3.5 text-ai-chat-muted-foreground"
                  aria-hidden="true"
                />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent>{copyLabel}</TooltipContent>
        </Tooltip>
      )}

      {messageRole === "assistant" && (
        <>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => onFeedback?.("up")}
                className="size-7 inline-flex items-center justify-center rounded-md hover:bg-ai-chat-muted transition-colors"
                aria-label={LABELS.helpful}
              >
                <ThumbsUp
                  className="size-3.5 text-ai-chat-muted-foreground"
                  aria-hidden="true"
                />
              </button>
            </TooltipTrigger>
            <TooltipContent>{LABELS.helpful}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => onFeedback?.("down")}
                className="size-7 inline-flex items-center justify-center rounded-md hover:bg-ai-chat-muted transition-colors"
                aria-label={LABELS.notHelpful}
              >
                <ThumbsDown
                  className="size-3.5 text-ai-chat-muted-foreground"
                  aria-hidden="true"
                />
              </button>
            </TooltipTrigger>
            <TooltipContent>{LABELS.notHelpful}</TooltipContent>
          </Tooltip>
        </>
      )}

      {messageRole === "assistant" && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => onRegenerate?.()}
              className="size-7 inline-flex items-center justify-center rounded-md hover:bg-ai-chat-muted transition-colors"
              aria-label={LABELS.regenerate}
            >
              <RefreshCw
                className="size-3.5 text-ai-chat-muted-foreground"
                aria-hidden="true"
              />
            </button>
          </TooltipTrigger>
          <TooltipContent>{LABELS.regenerate}</TooltipContent>
        </Tooltip>
      )}

      {messageRole === "user" && onEdit && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onEdit}
              className="size-7 inline-flex items-center justify-center rounded-md hover:bg-ai-chat-muted transition-colors"
              aria-label={LABELS.edit}
            >
              <Pencil
                className="size-3.5 text-ai-chat-muted-foreground"
                aria-hidden="true"
              />
            </button>
          </TooltipTrigger>
          <TooltipContent>{LABELS.edit}</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
