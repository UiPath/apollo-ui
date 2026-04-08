"use client";

import { Paperclip, Send, Square, Trash2 } from "lucide-react";
import { type FormEvent, type KeyboardEvent, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/registry/button/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/registry/tooltip/tooltip";
import { useAiChat } from "./ai-chat-provider";

const UPLOAD_LABEL = "Attach files";
const ENTER_HINT = "Enter to send, Shift+Enter for new line";

interface AiChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  onClear?: () => void;
  onFileSelect?: (files: FileList) => void;
  isLoading: boolean;
  disabled?: boolean;
  placeholder?: string;
  showClearButton?: boolean;
  hasMessages?: boolean;
  maxLength?: number;
}

export function AiChatInput({
  value,
  onChange,
  onSubmit,
  onStop,
  onClear,
  onFileSelect,
  isLoading,
  disabled = false,
  placeholder,
  showClearButton = true,
  hasMessages = false,
  maxLength,
}: AiChatInputProps) {
  const { t } = useTranslation();
  const { variant } = useAiChat();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isCompact = variant === "compact";
  const displayPlaceholder = placeholder ?? t("type_a_message");

  const adjustHeight = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  };

  const handleChange = (val: string) => {
    if (maxLength && val.length > maxLength) return;
    onChange(val);
    requestAnimationFrame(adjustHeight);
  };

  const submitMessage = () => {
    if (!value.trim() || isLoading) return;
    onSubmit();
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (el) {
        el.style.height = "auto";
      }
    });
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    submitMessage();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitMessage();
    }
  };

  const showCharCount = maxLength && value.length > maxLength * 0.8;

  return (
    <div className="p-3">
      <div className="flex items-end gap-2">
        <form
          onSubmit={handleSubmit}
          className={`flex-1 flex items-end gap-2 px-4 py-2 border-2 transition-colors bg-ai-chat-input border-transparent focus-within:border-ai-chat-ring focus-within:shadow-sm ${isCompact ? "rounded-lg" : "rounded-full"}`}
        >
          {onFileSelect && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="flex-shrink-0 mb-0.5 text-ai-chat-muted-foreground hover:text-ai-chat-foreground"
                  onClick={() => {
                    const fileInput = document.createElement("input");
                    fileInput.type = "file";
                    fileInput.multiple = true;
                    fileInput.addEventListener("change", () => {
                      if (fileInput.files) onFileSelect(fileInput.files);
                    });
                    fileInput.click();
                  }}
                >
                  <Paperclip className="size-4" aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{UPLOAD_LABEL}</TooltipContent>
            </Tooltip>
          )}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={displayPlaceholder}
            aria-label={displayPlaceholder}
            className="flex-1 resize-none bg-transparent text-sm text-ai-chat-input-foreground placeholder:text-ai-chat-muted-foreground focus-visible:outline-none min-h-[40px] max-h-[200px] py-1.5 overflow-y-auto"
            rows={1}
            disabled={disabled}
          />
          {isLoading ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="flex-shrink-0 mb-0.5"
                  onClick={onStop}
                >
                  <Square className="size-4" aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("stop")}</TooltipContent>
            </Tooltip>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="submit"
                  variant="default"
                  size="icon-sm"
                  className="flex-shrink-0 mb-0.5 bg-ai-chat-accent text-ai-chat-accent-foreground hover:bg-ai-chat-accent/90"
                  disabled={!value.trim() || disabled}
                >
                  <Send className="size-4" aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("send")}</TooltipContent>
            </Tooltip>
          )}
        </form>
        {showClearButton && hasMessages && onClear && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="flex-shrink-0 text-ai-chat-muted-foreground hover:text-ai-chat-foreground"
                onClick={onClear}
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("clear_conversation")}</TooltipContent>
          </Tooltip>
        )}
      </div>
      <div className="flex items-center justify-between px-2 mt-1">
        {!isCompact && (
          <span className="text-xs text-ai-chat-muted-foreground">
            {ENTER_HINT}
          </span>
        )}
        {showCharCount && (
          <span className="text-xs text-ai-chat-muted-foreground ml-auto">
            {`${value.length}/${maxLength}`}
          </span>
        )}
      </div>
    </div>
  );
}
