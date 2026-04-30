"use client";

import type { TextPart, UIMessage } from "@tanstack/ai-client";
import {
  AlertCircle,
  ArrowDown,
  MoreHorizontal,
  RefreshCw,
} from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useStickyScroll } from "../hooks/use-sticky-scroll";
import { AiChatInput, type AiChatInputHandle } from "./ai-chat-input";
import { AiChatLoading } from "./ai-chat-loading";
import { AutopilotGradientIcon } from "./icons/autopilot-gradient";

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
  showClearButton?: boolean;
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
  showClearButton = true,
  error,
}: AiChatProps) {
  const { t } = useTranslation();
  const [input, setInput] = useState("");
  const { scrollRef, contentRef, isStuck, scrollToBottom } = useStickyScroll();
  const inputRef = useRef<AiChatInputHandle>(null);

  const displayName = assistantName ?? t("ai_assistant");

  const queuedMessageRef = useRef<string | null>(null);
  const [conversationCopied, setConversationCopied] = useState(false);
  const [conversationCopyError, setConversationCopyError] = useState(false);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopyConversation = async () => {
    const text = messages
      .map((m) => {
        const content = m.parts
          .filter((p): p is TextPart => p.type === "text")
          .map((p) => p.content)
          .join("");
        if (!content) return null;
        const label = m.role === "user" ? "You" : displayName;
        return `${label}: ${content}`;
      })
      .filter(Boolean)
      .join("\n\n");

    try {
      await navigator.clipboard.writeText(text);
      setConversationCopied(true);
      setConversationCopyError(false);
    } catch {
      setConversationCopied(false);
      setConversationCopyError(true);
    }

    if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    copiedTimerRef.current = setTimeout(() => {
      setConversationCopied(false);
      setConversationCopyError(false);
      copiedTimerRef.current = null;
    }, 2000);
  };

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

  const copyConversationLabel = conversationCopyError
    ? t("copy_conversation_failed")
    : conversationCopied
      ? t("copied")
      : t("copy_conversation");

  return (
    <div
      className="flex flex-col h-full max-w-[680px] mx-auto bg-transparent text-ai-chat-foreground overflow-hidden"
      data-slot="ai-chat"
    >
      {header ??
        (title && (
          <div className="relative z-10 py-3 px-4 flex items-center justify-between gap-2 bg-background">
            <div className="flex items-center gap-1.5 min-w-0">
              <AutopilotGradientIcon
                size={21}
                className="flex-shrink-0"
                aria-hidden="true"
              />
              <span className="text-sm font-bold tracking-tight bg-clip-text text-transparent truncate pt-[2px] [background-image:linear-gradient(97.73deg,#5D4ED0_8.79%,#1076A0_91.48%)] dark:[background-image:linear-gradient(97.73deg,#9485F5_8.79%,#69C7DD_91.48%)]">
                {title}
              </span>
            </div>
            {messages.length > 0 && (
              <AlertDialog>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="size-7 inline-flex items-center justify-center rounded-md hover:bg-ai-chat-muted transition-colors flex-shrink-0"
                      aria-label={t("more_options")}
                    >
                      <MoreHorizontal
                        className="size-4 text-ai-chat-muted-foreground"
                        aria-hidden="true"
                      />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        void handleCopyConversation();
                      }}
                    >
                      {copyConversationLabel}
                    </DropdownMenuItem>
                    {onClearChat && showClearButton && (
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem>
                          {t("new_conversation")}
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {t("new_conversation_confirm_title")}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("new_conversation_confirm_description")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onClearChat?.()}>
                      {t("new_conversation")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        ))}

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
                  <button
                    key={suggestion}
                    type="button"
                    className="py-2 px-4 text-xs font-semibold rounded-full border border-input bg-background text-foreground hover:bg-muted transition-colors"
                    onClick={() => {
                      if (onSuggestionClick) {
                        onSuggestionClick(suggestion);
                      } else {
                        onSendMessage(suggestion);
                      }
                    }}
                  >
                    {suggestion}
                  </button>
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
            <button
              type="button"
              onClick={scrollToBottom}
              aria-label={t("scroll_to_bottom")}
              className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex items-center justify-center size-8 rounded-full border border-ai-chat-border bg-ai-chat shadow-md hover:bg-ai-chat-muted"
            >
              <ArrowDown className="size-4" />
            </button>
          )}
        </div>
      )}

      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="relative z-0 mx-4 -mb-6 flex items-center gap-2 rounded-t-lg bg-destructive/10 px-[23px] pt-3 pb-6 text-sm text-destructive"
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
          <span className="flex-1">{error.message}</span>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="flex-shrink-0 inline-flex items-center gap-1 text-xs font-medium hover:underline"
              aria-label={t("retry")}
            >
              <RefreshCw className="size-3" aria-hidden="true" />
              {t("retry")}
            </button>
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
