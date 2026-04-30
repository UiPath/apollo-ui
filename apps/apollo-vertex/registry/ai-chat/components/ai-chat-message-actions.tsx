"use client";

import { useClipboard } from "@mantine/hooks";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import {
  Check,
  Copy,
  Pencil,
  RefreshCw,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { MessageFeedbackType } from "../types";

interface IconActionButtonProps {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  pressed?: boolean;
}

function IconActionButton({
  icon,
  label,
  onClick,
  pressed,
}: IconActionButtonProps) {
  return (
    <TooltipPrimitive.Root>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={label}
          {...(pressed == null ? {} : { "aria-pressed": pressed })}
          onClick={onClick}
          className={cn(
            "hover:bg-ai-chat-muted",
            pressed && "bg-ai-chat-muted text-foreground",
          )}
        >
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </TooltipPrimitive.Root>
  );
}

interface CopyToClipboardButtonProps {
  value: string;
}

function CopyToClipboardButton({ value }: CopyToClipboardButtonProps) {
  const { t } = useTranslation();
  const { copied, error, copy } = useClipboard({ timeout: 2000 });

  const label = copied ? t("copied") : error ? t("copy_failed") : t("copy");

  return (
    <IconActionButton
      icon={
        copied ? (
          <Check className="size-3.5 text-success" aria-hidden="true" />
        ) : (
          <Copy
            className="size-3.5 text-ai-chat-muted-foreground"
            aria-hidden="true"
          />
        )
      }
      label={label}
      onClick={() => copy(value)}
    />
  );
}

const ICON_CLASSES = "size-3.5 text-ai-chat-muted-foreground";

interface AiChatMessageActionsProps {
  content: string;
  messageRole: "user" | "assistant";
  /** When true, actions are always visible (used for the latest assistant message). */
  isLatest?: boolean;
  /** Current feedback for this message — drives the thumbs-up/down pressed state. */
  feedback?: MessageFeedbackType | null;
  onFeedback?: (type: MessageFeedbackType) => void;
  onRegenerate?: () => void;
  onEdit?: () => void;
}

export function AiChatMessageActions({
  content,
  messageRole,
  isLatest = false,
  feedback,
  onFeedback,
  onRegenerate,
  onEdit,
}: AiChatMessageActionsProps) {
  const { t } = useTranslation();

  return (
    <TooltipProvider delayDuration={0} skipDelayDuration={150}>
      <div
        className={cn(
          "flex items-center gap-0.5 -ml-[7px] transition-opacity",
          isLatest
            ? "opacity-100"
            : "opacity-0 group-hover/message:opacity-100 group-focus-within/message:opacity-100 has-[[data-state=delayed-open]]:opacity-100 has-[[data-state=instant-open]]:opacity-100",
        )}
      >
        {content.trim() && <CopyToClipboardButton value={content} />}
        {messageRole === "assistant" && onFeedback && (
          <>
            <IconActionButton
              icon={<ThumbsUp className={ICON_CLASSES} aria-hidden="true" />}
              label={t("good_response")}
              onClick={() => onFeedback("positive")}
              pressed={feedback === "positive"}
            />
            <IconActionButton
              icon={<ThumbsDown className={ICON_CLASSES} aria-hidden="true" />}
              label={t("bad_response")}
              onClick={() => onFeedback("negative")}
              pressed={feedback === "negative"}
            />
          </>
        )}

        {messageRole === "assistant" && isLatest && onRegenerate && (
          <IconActionButton
            icon={<RefreshCw className={ICON_CLASSES} aria-hidden="true" />}
            label={t("try_again")}
            onClick={onRegenerate}
          />
        )}

        {messageRole === "user" && onEdit && (
          <IconActionButton
            icon={<Pencil className={ICON_CLASSES} aria-hidden="true" />}
            label={t("edit")}
            onClick={onEdit}
          />
        )}
      </div>
    </TooltipProvider>
  );
}
