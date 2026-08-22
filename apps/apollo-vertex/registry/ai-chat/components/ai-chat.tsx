"use client";

import type { ContentPart } from "@tanstack/ai";
import type {
  AnyClientTool,
  ChatClientState,
  TextPart,
  ToolCallPart,
  UIMessage,
} from "@tanstack/ai-client";
import {
  type DragEvent,
  Fragment,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { asBlockquote, isVisibleAssistant } from "../content-parts";
import { useStickyScroll } from "../hooks/use-sticky-scroll";
import type { MessageFeedbackType } from "../types";
import { AiChatEmptyState } from "./ai-chat-empty-state";
import { AiChatEmptySuggestions } from "./ai-chat-empty-suggestions";
import { AiChatErrorBanner } from "./ai-chat-error-banner";
import { AiChatHeader } from "./ai-chat-header";
import { AiChatInput, type AiChatInputHandle } from "./ai-chat-input";
import { AiChatLoading } from "./ai-chat-loading";
import { AiChatMessage } from "./ai-chat-message";
import { AiChatScrollToBottomButton } from "./ai-chat-scroll-to-bottom-button";
import { AiChatSelectionMenu } from "./ai-chat-selection-menu";

// Mirrors TanStack's own `= any` default for `UIMessage<TTools>` / `ToolCallPart<TTools>`;
// their conditional types detect the default and fall back to untyped tool parts.
// biome-ignore lint/suspicious/noExplicitAny: matches upstream TanStack AI generic default
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DefaultTools = any;

export interface AiChatProps<
  TTools extends ReadonlyArray<AnyClientTool> = DefaultTools,
> {
  messages: UIMessage<TTools>[];
  status: ChatClientState;
  onSendMessage: (content: string, parts?: ContentPart[]) => void;
  onStop: () => void;
  onClearChat?: () => void;
  onRetry?: () => void;
  onFeedback?: (messageId: string, type: MessageFeedbackType) => void;
  getFeedback?: (messageId: string) => MessageFeedbackType | null | undefined;
  onRegenerate?: () => void;
  onEditMessage?: (messageId: string, content: string) => void;
  renderToolPart?: (part: ToolCallPart<TTools>) => ReactNode;
  assistantName?: string;
  title?: string;
  header?: ReactNode;
  emptyState?: ReactNode;
  suggestions?: string[];
  onSuggestionClick?: (suggestion: string) => void;
  placeholder?: string;
  acceptedFileTypes?: string;
  enableTextSelection?: boolean;
  error?: Error | null;
}

export function AiChat<
  TTools extends ReadonlyArray<AnyClientTool> = DefaultTools,
>({
  messages,
  status,
  onSendMessage,
  onStop,
  onClearChat,
  onRetry,
  onFeedback,
  getFeedback,
  onRegenerate,
  onEditMessage,
  renderToolPart,
  assistantName,
  title,
  header,
  emptyState,
  suggestions,
  onSuggestionClick,
  placeholder,
  acceptedFileTypes,
  enableTextSelection = false,
  error,
}: AiChatProps<TTools>) {
  const { t } = useTranslation();
  const [input, setInput] = useState("");
  const [quotedText, setQuotedText] = useState<string | null>(null);
  const {
    attachScrollListeners,
    scrollElement,
    contentRef,
    isStuck,
    scrollToBottom,
  } = useStickyScroll();
  const inputRef = useRef<AiChatInputHandle>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const attachmentsEnabled = !!acceptedFileTypes;

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    if (!attachmentsEnabled) return;
    if (!e.dataTransfer.types.includes("Files")) return;
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    if (!attachmentsEnabled) return;
    const next = e.relatedTarget;
    if (next instanceof Node && e.currentTarget.contains(next)) return;
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    if (!attachmentsEnabled) return;
    if (!e.dataTransfer.types.includes("Files")) return;
    e.preventDefault();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    if (!attachmentsEnabled) return;
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      inputRef.current?.addFiles(e.dataTransfer.files);
    }
  };

  const displayName = assistantName ?? t("ai_assistant");
  const isInFlight = status === "submitted" || status === "streaming";

  const queuedMessageRef = useRef<{
    text: string;
    parts?: ContentPart[];
  } | null>(null);

  const conversationText = messages
    .map((m) => {
      const content = m.parts
        .filter((p): p is TextPart => p.type === "text")
        .map((p) => p.content)
        .join("");
      if (!content) return null;
      const label = m.role === "user" ? t("you") : displayName;
      return `${label}: ${content}`;
    })
    .filter(Boolean)
    .join("\n\n");

  const handleSubmit = (parts?: ContentPart[]) => {
    const text = input.trim();
    if (!text && !parts?.length) return;
    const composedText = quotedText
      ? `${asBlockquote(quotedText)}\n\n${text}`
      : text;
    if (isInFlight) {
      queuedMessageRef.current = { text: composedText, parts };
    } else {
      onSendMessage(composedText, parts);
      scrollToBottom();
    }
    setInput("");
    setQuotedText(null);
  };

  const wasInFlightRef = useRef(false);
  useEffect(() => {
    if (wasInFlightRef.current && !isInFlight) {
      if (queuedMessageRef.current) {
        const { text: queuedText, parts: queuedParts } =
          queuedMessageRef.current;
        queuedMessageRef.current = null;
        onSendMessage(queuedText, queuedParts);
        scrollToBottom();
      } else {
        inputRef.current?.focus();
      }
    }
    wasInFlightRef.current = isInFlight;
  }, [isInFlight, onSendMessage, scrollToBottom]);

  const handleAskAi = (text: string) => {
    setQuotedText(text);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const lastMessage = messages.at(-1);
  const lastMessageId = lastMessage?.id ?? null;
  const lastAssistantHasText =
    lastMessage?.role === "assistant" &&
    lastMessage.parts.some((p) => p.type === "text" && p.content);
  const showLoadingIndicator = isInFlight && !lastAssistantHasText;

  const latestVisibleAssistantId =
    messages.findLast((m) => isVisibleAssistant(m))?.id ?? null;

  const defaultEmptyState = (
    <AiChatEmptyState
      title={t("shell_empty_title")}
      description={t("shell_empty_description")}
    />
  );

  const defaultHeader = title && (
    <AiChatHeader
      title={title}
      hasMessages={messages.length > 0}
      conversationText={conversationText}
      onClearChat={onClearChat}
    />
  );

  const sharedInputProps = {
    ref: inputRef,
    value: input,
    onChange: setInput,
    onSubmit: handleSubmit,
    onStop,
    isLoading: isInFlight,
    placeholder,
    acceptedFileTypes,
    quotedText,
    onClearQuote: () => setQuotedText(null),
  };

  return (
    <div
      className={cn(
        "flex flex-col h-full max-w-[680px] mx-auto bg-transparent text-ai-chat-foreground overflow-hidden rounded-lg border-2 border-dashed border-transparent transition-colors",
        isDragging && "border-primary",
      )}
      data-slot="ai-chat"
      ref={chatContainerRef}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {header ?? defaultHeader}

      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center min-h-0">
          <div className="w-full">
            <div className="px-4 text-center mb-5">
              {emptyState ?? defaultEmptyState}
            </div>
            <AiChatInput {...sharedInputProps} hasMessages={false} />
            {suggestions && (
              <AiChatEmptySuggestions
                suggestions={suggestions}
                onSelect={onSuggestionClick ?? onSendMessage}
              />
            )}
          </div>
        </div>
      ) : (
        <div className="relative flex-1 min-h-0">
          <div
            ref={attachScrollListeners}
            role="log"
            aria-label={t("chat_messages")}
            aria-live="polite"
            aria-atomic="false"
            aria-busy={isInFlight}
            // Fade content out at the top edge via an alpha mask (works over any
            // background, unlike a solid-color gradient overlay).
            className="relative h-full overflow-y-auto py-4 pl-10 pr-10 [scrollbar-gutter:stable] [mask-image:linear-gradient(to_bottom,transparent_0,#000_24px)] [-webkit-mask-image:linear-gradient(to_bottom,transparent_0,#000_24px)]"
          >
            {enableTextSelection && (
              <AiChatSelectionMenu
                onAskAi={handleAskAi}
                containerRef={scrollElement}
              />
            )}
            <div ref={contentRef} className="space-y-1">
              {messages.map((message) => {
                const isLatestVisibleAssistant =
                  message.role === "assistant" &&
                  message.id === latestVisibleAssistantId;
                const hideActions =
                  isInFlight &&
                  message.role === "assistant" &&
                  message.id === lastMessageId;

                return (
                  <AiChatMessage
                    key={message.id}
                    message={message}
                    hideActions={hideActions}
                    showActionsAlwaysVisible={
                      !isInFlight && isLatestVisibleAssistant
                    }
                    {...(getFeedback
                      ? { feedback: getFeedback(message.id) ?? null }
                      : {})}
                    {...(onFeedback
                      ? {
                          onFeedback: (type) => onFeedback(message.id, type),
                        }
                      : {})}
                    {...(onRegenerate ? { onRegenerate } : {})}
                    {...(onEditMessage && !isInFlight
                      ? {
                          onEditMessage: (content) =>
                            onEditMessage(message.id, content),
                        }
                      : {})}
                  >
                    {renderToolPart &&
                      message.parts.map((part) => {
                        if (part.type !== "tool-call") return null;
                        const rendered = renderToolPart(part);
                        if (rendered == null) return null;
                        return <Fragment key={part.id}>{rendered}</Fragment>;
                      })}
                  </AiChatMessage>
                );
              })}
              {showLoadingIndicator && <AiChatLoading />}
            </div>
          </div>

          {!isStuck && <AiChatScrollToBottomButton onClick={scrollToBottom} />}
        </div>
      )}

      {error && <AiChatErrorBanner message={error.message} onRetry={onRetry} />}

      {messages.length > 0 && (
        <div>
          <AiChatInput {...sharedInputProps} hasMessages />
          <div className="pt-2 pb-3 px-4 text-xs leading-normal text-muted-foreground text-center">
            {t("ai_response_disclaimer")}
          </div>
        </div>
      )}
    </div>
  );
}
