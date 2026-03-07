"use client";

import { Send, Square, Trash2 } from "lucide-react";
import type { FormEvent, KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";

interface AiChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  onClear?: () => void;
  isLoading: boolean;
  disabled?: boolean;
  placeholder?: string;
  showClearButton?: boolean;
  hasMessages?: boolean;
}

export function AiChatInput({
  value,
  onChange,
  onSubmit,
  onStop,
  onClear,
  isLoading,
  disabled = false,
  placeholder,
  showClearButton = true,
  hasMessages = false,
}: AiChatInputProps) {
  const { t } = useTranslation();
  const displayPlaceholder = placeholder ?? t("type_a_message");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!value.trim() || isLoading) return;
    onSubmit();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="p-3">
      <div className="flex items-center gap-2">
        <form
          onSubmit={handleSubmit}
          className="flex-1 flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-colors bg-muted/50 border-transparent"
        >
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={displayPlaceholder}
            aria-label={displayPlaceholder}
            className="flex-1 resize-none bg-transparent text-sm placeholder:text-muted-foreground focus-visible:outline-none min-h-[32px] max-h-[120px] py-1"
            rows={1}
            disabled={disabled}
          />
          {isLoading ? (
            <button
              type="button"
              className="size-8 rounded-full flex-shrink-0 flex items-center justify-center hover:bg-muted transition-colors"
              onClick={onStop}
              aria-label={t("stop")}
              title={t("stop")}
            >
              <Square className="size-4" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="submit"
              className="size-8 rounded-full flex-shrink-0 flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!value.trim() || disabled}
              aria-label={t("send")}
              title={t("send")}
            >
              <Send className="size-4" aria-hidden="true" />
            </button>
          )}
        </form>
        {showClearButton && hasMessages && onClear && (
          <button
            type="button"
            className="size-8 rounded-full flex-shrink-0 flex items-center justify-center hover:bg-muted transition-colors"
            onClick={onClear}
            aria-label={t("clear_conversation")}
            title={t("clear_conversation")}
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
