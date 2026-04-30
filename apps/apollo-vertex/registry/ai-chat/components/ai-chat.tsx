"use client";

import type { TextPart, UIMessage } from "@tanstack/ai-client";
import { AlertCircle, ArrowDown, RefreshCw } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useStickyScroll } from "../hooks/use-sticky-scroll";
import { AiChatHeader } from "./ai-chat-header";
import { AiChatInput, type AiChatInputHandle } from "./ai-chat-input";
import { AiChatLoading } from "./ai-chat-loading";

export interface AiChatProps {
  messages: UIMessage[];
  isLoading: boolean;
  onSendMessage: (content: string) => void;
  onStop: () => void;
  onClearChat?: () => void;
  onRetry?: () => void;
  children?: ReactNode;
  assistantName?: string;
  title?: string;
  header?: ReactNode;
  emptyState?: ReactNode;
  /** Quick-start suggestions shown below the input in the empty state */
  suggestions?: string[];
  /** Called when the user clicks a suggestion in the empty state */
  onSuggestionClick?: (suggestion: string) => void;
  placeholder?: string;
  error?: Error | null;
}

export function AiChat({
  messages,
  isLoading,
  onSendMessage,
  onStop,
  onClearChat,
  onRetry,
  children,
  assistantName,
  title,
  header,
  emptyState,
  suggestions,
  onSuggestionClick,
  placeholder,
  error,
}: AiChatProps) {
  const { t } = useTranslation();
  const [input, setInput] = useState("");
  const { scrollRef, contentRef, isStuck, scrollToBottom } = useStickyScroll();
  const inputRef = useRef<AiChatInputHandle>(null);

  const displayName = assistantName ?? t("ai_assistant");

  const queuedMessageRef = useRef<string | null>(null);

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

  const handleSubmit = () => {
    if (!input.trim()) return;
    if (isLoading) {
      queuedMessageRef.current = input.trim();
      setInput("");
      return;
    }
    onSendMessage(input.trim());
    setInput("");
    scrollToBottom();
  };

  const wasLoadingRef = useRef(false);
  useEffect(() => {
    if (wasLoadingRef.current && !isLoading) {
      if (queuedMessageRef.current) {
        const queued = queuedMessageRef.current;
        queuedMessageRef.current = null;
        onSendMessage(queued);
        scrollToBottom();
      } else {
        inputRef.current?.focus();
      }
    }
    wasLoadingRef.current = isLoading;
  }, [isLoading, onSendMessage, scrollToBottom]);

  const lastMessage = messages.at(-1);
  const lastAssistantHasText =
    lastMessage?.role === "assistant" &&
    lastMessage.parts.some((p) => p.type === "text" && p.content);
  const showLoadingIndicator = isLoading && !lastAssistantHasText;

  const defaultEmptyState = (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <div className="flex flex-col items-center gap-1">
        <h2 className="text-2xl font-semibold leading-tight tracking-tight text-foreground">
          {t("shell_empty_title")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("shell_empty_description")}
        </p>
      </div>
    </div>
  );

  const defaultHeader = title && (
    <AiChatHeader
      title={title}
      hasMessages={messages.length > 0}
      conversationText={conversationText}
      onClearChat={onClearChat}
    />
  );

  return (
    <div
      className="flex flex-col h-full max-w-[680px] mx-auto bg-transparent text-ai-chat-foreground overflow-hidden"
      data-slot="ai-chat"
    >
      {header ?? defaultHeader}

      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center min-h-0">
          <div className="w-full">
            <div className="px-4 text-center mb-7">
              {emptyState ?? defaultEmptyState}
            </div>
            <AiChatInput
              ref={inputRef}
              value={input}
              onChange={setInput}
              onSubmit={handleSubmit}
              onStop={onStop}
              isLoading={isLoading}
              placeholder={placeholder}
              hasMessages={false}
            />
            {suggestions && suggestions.length > 0 && (
              <div className="mt-4 px-4 flex flex-wrap justify-center gap-2">
                {suggestions.map((suggestion) => (
                  <Button
                    key={suggestion}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-full text-xs font-semibold"
                    onClick={() => {
                      if (onSuggestionClick) {
                        onSuggestionClick(suggestion);
                      } else {
                        onSendMessage(suggestion);
                      }
                    }}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="relative flex-1 min-h-0">
          <div
            className="absolute top-0 left-0 right-0 h-6 z-10 pointer-events-none"
            style={{
              background:
                "linear-gradient(to bottom, var(--background) 0%, transparent 100%)",
            }}
            aria-hidden="true"
          />
          <div
            ref={scrollRef}
            role="log"
            aria-label={t("chat_messages")}
            aria-live="polite"
            aria-atomic="false"
            aria-busy={isLoading}
            className="h-full overflow-y-auto py-4 pl-10 pr-10"
          >
            <div ref={contentRef} className="space-y-1">
              {children}
              {showLoadingIndicator && <AiChatLoading />}
            </div>
          </div>

          {!isStuck && (
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={scrollToBottom}
              aria-label={t("scroll_to_bottom")}
              className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 size-8 rounded-full border-ai-chat-border bg-ai-chat shadow-md hover:bg-ai-chat-muted"
            >
              <ArrowDown className="size-4" />
            </Button>
          )}
        </div>
      )}

      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="relative z-0 mx-4 -mb-6 flex items-center gap-2 rounded-t-lg bg-destructive/10 px-6 pt-3 pb-6 text-sm text-destructive"
        >
          <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
          <span className="flex-1 break-words">{error.message}</span>
          {onRetry && (
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={onRetry}
              className="shrink-0 h-auto p-0 text-xs font-medium text-destructive"
              aria-label={t("retry")}
            >
              <RefreshCw className="size-3" aria-hidden="true" />
              {t("retry")}
            </Button>
          )}
        </div>
      )}

      {messages.length > 0 && (
        <div>
          <AiChatInput
            ref={inputRef}
            value={input}
            onChange={setInput}
            onSubmit={handleSubmit}
            onStop={onStop}
            isLoading={isLoading}
            placeholder={placeholder}
            hasMessages
          />
          <div className="pt-2 pb-3 px-4 text-xs leading-normal text-muted-foreground text-center">
            {t("ai_response_disclaimer")}
          </div>
        </div>
      )}
    </div>
  );
}
