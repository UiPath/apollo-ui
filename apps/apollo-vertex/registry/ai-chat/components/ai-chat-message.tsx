"use client";

import type { ImagePart } from "@tanstack/ai";
import type { TextPart, UIMessage } from "@tanstack/ai-client";
import { imagePartToUrl } from "../content-parts";
import { motion } from "framer-motion";
import { type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ENTRANCE_ANIMATE,
  ENTRANCE_EASE,
  ENTRANCE_INITIAL,
} from "../animations";
import type { MessageFeedbackType } from "../types";
import { AiChatImagePreview } from "./ai-chat-image-preview";
import { AiChatMarkdown } from "./ai-chat-markdown";
import { AiChatMessageActions } from "./ai-chat-message-actions";

// Quick, subtle entrance — fade + 8px slide up. Quartic ease-out for a soft settle.
const ENTRANCE_TRANSITION = { duration: 0.22, ease: ENTRANCE_EASE };

function focusAndScrollEditTextarea(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.select();
  requestAnimationFrame(() => {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}

interface AiChatMessageProps {
  message: UIMessage;
  children?: ReactNode;
  hideActions?: boolean;
  showActionsAlwaysVisible?: boolean;
  feedback?: MessageFeedbackType | null;
  onFeedback?: (type: MessageFeedbackType) => void;
  onRegenerate?: () => void;
  onEditMessage?: (content: string) => void;
}

function getDisplayText(message: UIMessage): string {
  return message.parts
    .filter((p): p is TextPart => p.type === "text")
    .map((p) => p.content)
    .join("");
}

function getImageParts(message: UIMessage): ImagePart[] {
  return message.parts.filter((p): p is ImagePart => p.type === "image");
}

export function AiChatMessage({
  message,
  children,
  hideActions = false,
  showActionsAlwaysVisible = false,
  feedback,
  onFeedback,
  onRegenerate,
  onEditMessage,
}: AiChatMessageProps) {
  const { t } = useTranslation();
  const isUser = message.role === "user";
  const displayContent = getDisplayText(message);
  const imageParts = getImageParts(message);
  const hasText = !!displayContent;
  const hasImages = imageParts.length > 0;

  const [editValue, setEditValue] = useState<string | null>(null);
  const isEditing = editValue !== null;
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const startEditing = () => setEditValue(displayContent);
  const cancelEditing = () => setEditValue(null);
  const handleSave = () => {
    if (editValue === null) return;
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== displayContent) {
      onEditMessage?.(trimmed);
    }
    setEditValue(null);
  };

  const hasToolOutputs = message.parts.some(
    (p) => p.type === "tool-call" && p.output != null,
  );
  const hasContent =
    hasToolOutputs || message.parts.some((p) => p.type === "text" && p.content);

  if (!isUser && !hasContent) return null;

  if (isUser) {
    return (
      <motion.div
        className="flex w-full justify-end"
        initial={ENTRANCE_INITIAL}
        animate={ENTRANCE_ANIMATE}
        transition={ENTRANCE_TRANSITION}
      >
        {isEditing ? (
          <div className="flex flex-col items-end gap-2 w-[80%]">
            <Textarea
              ref={focusAndScrollEditTextarea}
              autoFocus
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSave();
                }
                if (e.key === "Escape") cancelEditing();
              }}
              className="rounded-2xl rounded-br-md bg-ai-chat-bubble-user text-ai-chat-bubble-user-foreground border-2 border-primary/40 min-h-15 px-4 py-2 text-sm leading-6"
              rows={3}
            />
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={cancelEditing}
              >
                {t("cancel")}
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSave}
                disabled={
                  !editValue.trim() || editValue.trim() === displayContent
                }
              >
                {t("save_and_rerun")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="group/message flex flex-col items-end gap-1 max-w-[80%]">
            {hasImages && (
              <div className="flex flex-wrap justify-end gap-2">
                {imageParts.map((part) => {
                  const url = imagePartToUrl(part);
                  return (
                    <Button
                      key={`${message.id}-${part.source.value.slice(0, 64)}`}
                      type="button"
                      variant="ghost"
                      onClick={() => setPreviewUrl(url)}
                      aria-label={t("image_preview")}
                      className="size-10 p-0 rounded-md overflow-hidden border border-border hover:opacity-80"
                    >
                      <img
                        src={url}
                        alt=""
                        className="size-full object-cover"
                      />
                    </Button>
                  );
                })}
              </div>
            )}
            <AiChatImagePreview
              url={previewUrl}
              onClose={() => setPreviewUrl(null)}
            />
            {hasText && (
              <div className="px-4 py-2 text-sm leading-6 rounded-2xl rounded-br-md bg-ai-chat-bubble-user text-ai-chat-bubble-user-foreground">
                <AiChatMarkdown
                  className="text-sm leading-6"
                  preserveLineBreaks
                >
                  {displayContent}
                </AiChatMarkdown>
              </div>
            )}
            <AiChatMessageActions
              content={displayContent}
              messageRole="user"
              {...(onEditMessage ? { onEdit: startEditing } : {})}
            />
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      className="flex w-full justify-start"
      initial={ENTRANCE_INITIAL}
      animate={ENTRANCE_ANIMATE}
      transition={ENTRANCE_TRANSITION}
    >
      {/* Column fills available width so chart/tool outputs (which size off
          parent width) can stretch. Only the markdown bubble is capped. */}
      <div className="group/message flex flex-col gap-3 flex-1 min-w-0">
        {displayContent && (
          <div className="max-w-[85%]">
            <AiChatMarkdown>{displayContent}</AiChatMarkdown>
          </div>
        )}
        {children && <div className="mt-2 flex flex-col gap-2">{children}</div>}

        {!hideActions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, ease: ENTRANCE_EASE }}
          >
            <AiChatMessageActions
              content={displayContent}
              messageRole="assistant"
              isLatest={showActionsAlwaysVisible}
              feedback={feedback}
              onFeedback={onFeedback}
              onRegenerate={onRegenerate}
            />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
