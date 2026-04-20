"use client";

import type { TextPart, UIMessage } from "@tanstack/ai-client";
import { motion } from "framer-motion";
import { ExternalLink, FileText } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { Badge } from "@/registry/badge/badge";
import type { MessageFeedbackType } from "../types";
import { AiChatMarkdown } from "./ai-chat-markdown";
import { AiChatMessageActions } from "./ai-chat-message-actions";
import { AiChatSelectionMenu } from "./ai-chat-selection-menu";
import { useAiChat } from "./ai-chat-provider";

// Quick, subtle entrance — fade + 8px slide up. Quartic ease-out for a soft settle.
const ENTRANCE_INITIAL = { opacity: 0, y: 8 };
const ENTRANCE_ANIMATE = { opacity: 1, y: 0 };
const ENTRANCE_TRANSITION = {
  duration: 0.22,
  ease: [0.22, 1, 0.36, 1] as const,
};

export interface MessageSource {
  label: string;
  url?: string;
}

export interface MessageAttachment {
  name: string;
  type?: string;
  size?: number;
}

interface AiChatMessageProps {
  message: UIMessage;
  children?: ReactNode;
  /** Whether this message is currently being streamed */
  isStreaming?: boolean;
  /** Callbacks for message actions */
  onFeedback?: (type: MessageFeedbackType) => void;
  onRegenerate?: () => void;
  /** Source citations shown below an assistant message */
  sources?: MessageSource[];
  /** File attachments shown in a user message bubble */
  attachments?: MessageAttachment[];
}

function getDisplayText(message: UIMessage): string {
  return message.parts
    .filter((p): p is TextPart => p.type === "text")
    .map((p) => p.content)
    .join("");
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AiChatMessage({
  message,
  children,
  isStreaming: isStreamingProp,
  onFeedback,
  onRegenerate,
  sources,
  attachments,
}: AiChatMessageProps) {
  const config = useAiChat();
  const isUser = message.role === "user";
  const displayContent = getDisplayText(message);

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(displayContent);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  const [selectionMenu, setSelectionMenu] = useState<{
    x: number;
    y: number;
    text: string;
  } | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleMouseUp = () => {
    if (isUser || !config.onQuoteSelect) return;
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    if (!text || !selection || selection.rangeCount === 0) {
      setSelectionMenu(null);
      return;
    }
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    setSelectionMenu({
      x: rect.left + rect.width / 2,
      y: rect.top,
      text,
    });
  };

  // Keep editValue in sync if message content changes externally (e.g. regenerate)
  useEffect(() => {
    if (!isEditing) setEditValue(displayContent);
  }, [displayContent, isEditing]);

  // Auto-focus, select all, and scroll into view when entering edit mode.
  // rAF defers the scroll until after React has committed the new layout
  // (bubble → textarea expansion), so scrollIntoView sees the final dimensions.
  useEffect(() => {
    if (isEditing && editTextareaRef.current) {
      editTextareaRef.current.focus();
      editTextareaRef.current.select();
      const el = editTextareaRef.current;
      requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    }
  }, [isEditing]);

  const handleSave = () => {
    if (editValue.trim() && editValue.trim() !== displayContent) {
      config.onEditMessage?.(message.id, editValue.trim());
    }
    setIsEditing(false);
  };

  // Streaming state — explicit prop wins, otherwise derive from chat-level isLoading
  // and the latest assistant message ID. The latest assistant message is the one
  // currently being generated when isLoading is true.
  const isStreaming =
    isStreamingProp ??
    (config.isLoading &&
      !isUser &&
      config.latestAssistantMessageId === message.id);

  // Latest assistant message keeps its actions always-visible; older messages
  // hover-reveal. The chat parent computes the latest ID via context.
  const isLatestAssistant =
    !isUser && config.latestAssistantMessageId === message.id;

  const isResponseFullyRevealed = !isStreaming;

  if (!isUser && !displayContent && !children) {
    return null;
  }

  if (isUser) {
    // Edit mode — swap bubble for inline textarea
    if (isEditing) {
      return (
        <motion.div
          className="flex w-full justify-end"
          initial={ENTRANCE_INITIAL}
          animate={ENTRANCE_ANIMATE}
          transition={ENTRANCE_TRANSITION}
        >
          <div className="flex flex-col items-end gap-2 w-[80%]">
            <textarea
              ref={editTextareaRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSave();
                }
                if (e.key === "Escape") setIsEditing(false);
              }}
              className="w-full px-4 py-2 text-sm leading-6 rounded-2xl rounded-br-md bg-ai-chat-bubble-user text-ai-chat-bubble-user-foreground resize-none focus:outline-none border-2 border-primary/40 min-h-[60px]"
              rows={3}
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-1 text-xs rounded-md hover:bg-muted text-muted-foreground transition-colors"
              >
                {"Cancel"}
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!editValue.trim()}
                className="px-3 py-1 text-xs rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors"
              >
                {"Save & re-run"}
              </button>
            </div>
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div
        className="flex w-full justify-end"
        initial={ENTRANCE_INITIAL}
        animate={ENTRANCE_ANIMATE}
        transition={ENTRANCE_TRANSITION}
      >
        <div className="group/message flex flex-col items-end gap-1 max-w-[80%]">
          <div className="px-4 py-2 text-sm leading-6 rounded-2xl rounded-br-md bg-ai-chat-bubble-user text-ai-chat-bubble-user-foreground">
            {attachments && attachments.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {attachments.map((att) => (
                  <div
                    key={att.name}
                    className="flex items-center gap-1 pl-2 pr-2 py-1 rounded-md bg-white/10 text-xs"
                  >
                    <FileText
                      className="size-3 flex-shrink-0 opacity-70"
                      aria-hidden="true"
                    />
                    <span className="truncate max-w-[120px]">{att.name}</span>
                    {att.size != null && (
                      <span className="opacity-60 flex-shrink-0">
                        {formatFileSize(att.size)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
            {displayContent && (
              <p className="whitespace-pre-wrap">{displayContent}</p>
            )}
          </div>
          {config.showMessageActions && (
            <AiChatMessageActions
              content={displayContent}
              messageRole="user"
              showCopy={config.showCopyButton}
              {...(config.onEditMessage
                ? { onEdit: () => setIsEditing(true) }
                : {})}
            />
          )}
        </div>
      </motion.div>
    );
  }

  // Hide message-level actions when this message belongs to a turn currently
  // presenting interactive choices — copy/feedback/regenerate aren't meaningful
  return (
    <>
      {selectionMenu && (
        <AiChatSelectionMenu
          x={selectionMenu.x}
          y={selectionMenu.y}
          onAsk={() => {
            config.onQuoteSelect?.(selectionMenu.text);
            setSelectionMenu(null);
            window.getSelection()?.removeAllRanges();
          }}
          onDismiss={() => setSelectionMenu(null)}
        />
      )}
      <motion.div
        className="flex w-full justify-start"
        initial={ENTRANCE_INITIAL}
        animate={ENTRANCE_ANIMATE}
        transition={ENTRANCE_TRANSITION}
        onMouseUp={handleMouseUp}
      >
        <div
          ref={contentRef}
          className="group/message flex flex-col gap-3 max-w-[85%]"
        >
          {displayContent &&
            (isResponseFullyRevealed ? (
              <AiChatMarkdown>{displayContent}</AiChatMarkdown>
            ) : (
              <p className="py-1 text-base leading-relaxed text-foreground whitespace-pre-wrap">
                {displayContent}
              </p>
            ))}
          {children && (
            <div className="mt-2 flex flex-col gap-2">{children}</div>
          )}

          {sources && sources.length > 0 && isResponseFullyRevealed && (
            <motion.div
              className="flex flex-wrap gap-1.5"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              {sources.map((source) =>
                source.url ? (
                  <a
                    key={source.url}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="no-underline"
                  >
                    <Badge
                      variant="outline"
                      className="gap-1 cursor-pointer hover:bg-muted transition-colors"
                    >
                      <ExternalLink className="size-3" aria-hidden="true" />
                      {source.label}
                    </Badge>
                  </a>
                ) : (
                  <Badge key={source.label} variant="outline" className="gap-1">
                    <ExternalLink className="size-3" aria-hidden="true" />
                    {source.label}
                  </Badge>
                ),
              )}
            </motion.div>
          )}

          {config.showMessageActions &&
            isResponseFullyRevealed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              >
                <AiChatMessageActions
                  content={displayContent}
                  messageRole="assistant"
                  isLatest={isLatestAssistant}
                  showCopy={config.showCopyButton}
                  {...((onFeedback ?? config.onFeedback)
                    ? {
                        onFeedback:
                          onFeedback ??
                          ((type) => config.onFeedback?.(message.id, type)),
                      }
                    : {})}
                  onRegenerate={onRegenerate ?? config.onRegenerate}
                />
              </motion.div>
            )}
        </div>
      </motion.div>
    </>
  );
}
