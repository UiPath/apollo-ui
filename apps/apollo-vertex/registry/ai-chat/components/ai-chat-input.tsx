"use client";

import { ArrowUp, CircleStop } from "lucide-react";
import {
  type CSSProperties,
  type FocusEvent,
  type FormEvent,
  type KeyboardEvent,
  type Ref,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AiChatInputGlow } from "./ai-chat-input-glow";

interface AiChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  isLoading: boolean;
  disabled?: boolean;
  placeholder?: string;
  hasMessages?: boolean;
  ref?: Ref<AiChatInputHandle>;
}

export interface AiChatInputHandle {
  focus: () => void;
}

export function AiChatInput({
  value,
  onChange,
  onSubmit,
  onStop,
  isLoading,
  disabled = false,
  placeholder,
  hasMessages = false,
  ref,
}: AiChatInputProps) {
  const { t } = useTranslation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [focused, setFocused] = useState(false);
  const displayPlaceholder = placeholder ?? t("shell_input_placeholder");

  useImperativeHandle(ref, () => ({
    focus: () => textareaRef.current?.focus(),
  }));

  const adjustHeight = () => {
    if (!hasMessages) return;
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  };

  const handleChange = (val: string) => {
    onChange(val);
    requestAnimationFrame(adjustHeight);
  };

  const submitMessage = () => {
    if (!value.trim()) return;
    onSubmit();
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (el) el.style.height = "auto";
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

  const focusedStyle: CSSProperties = {
    borderColor: "transparent",
    backgroundImage:
      "linear-gradient(var(--background), var(--background)), var(--ai-gradient-strong)",
    backgroundOrigin: "border-box",
    backgroundClip: "padding-box, border-box",
    boxShadow:
      "0 0 0 3px color-mix(in oklch, var(--muted-foreground) 10%, transparent)",
  };

  const formProps = {
    onSubmit: handleSubmit,
    onFocus: () => setFocused(true),
    onBlur: (e: FocusEvent<HTMLFormElement>) => {
      if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false);
    },
    className:
      "relative flex flex-col rounded-lg border-2 border-input transition-colors bg-background",
    ...(focused && { style: focusedStyle }),
  };

  const sendStopButton = isLoading ? (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="flex-shrink-0 size-9 rounded-lg flex items-center justify-center bg-secondary transition-opacity"
          onClick={onStop}
        >
          <CircleStop className="size-5 text-foreground" aria-hidden="true" />
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
          className="flex-shrink-0 size-9 rounded-lg flex items-center justify-center text-white disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          style={{ background: "var(--ai-gradient-strong)" }}
          aria-label={t("send")}
        >
          <ArrowUp className="size-5" aria-hidden="true" />
        </button>
      </TooltipTrigger>
      <TooltipContent>{t("send")}</TooltipContent>
    </Tooltip>
  );

  return (
    <div className="relative z-10 mt-auto pt-3 px-4">
      <div className="relative">
        <div
          className={`absolute pointer-events-none transition-opacity duration-500 -top-14 -left-12 -right-12 -bottom-16 ${
            hasMessages || focused ? "opacity-0" : "opacity-100"
          }`}
          aria-hidden="true"
        >
          <AiChatInputGlow />
        </div>
        {hasMessages ? (
          <form {...formProps}>
            <div className="flex items-end gap-2 pl-[8px] pr-[8px] pt-[4px] pb-[8px]">
              <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => handleChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={displayPlaceholder}
                aria-label={displayPlaceholder}
                className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none max-h-[200px] overflow-y-auto h-[40px] pt-[12px] pb-[8px] leading-[20px]"
                rows={1}
                disabled={disabled}
              />
              {sendStopButton}
            </div>
          </form>
        ) : (
          <form {...formProps}>
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={displayPlaceholder}
              aria-label={displayPlaceholder}
              className="w-full resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none h-[80px] px-[22px] pt-5 pb-2 leading-relaxed"
              rows={1}
              disabled={disabled}
            />
            <div className="flex items-center justify-end px-[8px] pb-[8px]">
              {sendStopButton}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
