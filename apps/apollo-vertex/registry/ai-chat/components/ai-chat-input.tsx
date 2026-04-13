"use client";

import { ArrowUp, CircleStop, Paperclip } from "lucide-react";
import { type FormEvent, type KeyboardEvent, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/registry/button/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/registry/tooltip/tooltip";

const UPLOAD_LABEL = "Attach files";

interface AiChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  onFileSelect?: (files: FileList) => void;
  isLoading: boolean;
  disabled?: boolean;
  placeholder?: string;
  hasMessages?: boolean;
  maxLength?: number;
}

export function AiChatInput({
  value,
  onChange,
  onSubmit,
  onStop,
  onFileSelect,
  isLoading,
  disabled = false,
  placeholder,
  hasMessages = false,
  maxLength,
}: AiChatInputProps) {
  const { t } = useTranslation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const displayPlaceholder =
    placeholder ?? "Describe what you want to do\u2026";

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

  return (
    <div className="relative z-10 mt-auto pt-3 px-4">
      <div className="relative flex items-end gap-2">
        <div
          ref={glowRef}
          className={`absolute -inset-1 rounded-xl blur-sm transition-opacity duration-300 pointer-events-none ${hasMessages ? "opacity-0" : "opacity-10"}`}
          style={{ background: "var(--ai-gradient-strong)" }}
          aria-hidden="true"
        />
        <form
          onSubmit={handleSubmit}
          className="relative flex-1 flex items-end gap-2 pl-[22px] pr-[5px] py-[3px] rounded-lg border-2 border-input transition-colors bg-background"
          onFocusCapture={(e) => {
            const el = e.currentTarget;
            el.style.borderColor = "transparent";
            el.style.backgroundImage = `linear-gradient(var(--background), var(--background)), var(--ai-gradient-strong)`;
            el.style.backgroundOrigin = "border-box";
            el.style.backgroundClip = "padding-box, border-box";
            el.style.boxShadow =
              "0 0 0 3px color-mix(in oklch, var(--muted-foreground) 10%, transparent)";
            if (glowRef.current) glowRef.current.style.opacity = "0";
          }}
          onBlurCapture={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) {
              const el = e.currentTarget;
              el.style.borderColor = "";
              el.style.backgroundImage = "";
              el.style.backgroundOrigin = "";
              el.style.backgroundClip = "";
              el.style.boxShadow = "";
              if (glowRef.current) glowRef.current.style.opacity = "";
            }
          }}
        >
          {onFileSelect && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="flex-shrink-0 text-muted-foreground hover:text-foreground"
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
            className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none h-[40px] max-h-[200px] py-[10px] overflow-y-auto leading-[20px]"
            rows={1}
            disabled={disabled}
          />
          {isLoading ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="flex-shrink-0 size-9 mb-0.5 rounded-lg flex items-center justify-center bg-secondary transition-opacity"
                  onClick={onStop}
                >
                  <CircleStop
                    className="size-5 text-muted-foreground"
                    aria-hidden="true"
                  />
                </button>
              </TooltipTrigger>
              <TooltipContent>{t("stop")}</TooltipContent>
            </Tooltip>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="submit"
                  disabled={!value.trim() || disabled}
                  className="flex-shrink-0 size-9 mb-0.5 rounded-lg flex items-center justify-center text-white disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                  style={{ background: "var(--ai-gradient-strong)" }}
                  aria-label={t("send")}
                >
                  <ArrowUp className="size-5" aria-hidden="true" />
                </button>
              </TooltipTrigger>
              <TooltipContent>{t("send")}</TooltipContent>
            </Tooltip>
          )}
        </form>
      </div>
    </div>
  );
}
