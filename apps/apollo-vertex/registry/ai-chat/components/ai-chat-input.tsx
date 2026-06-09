"use client";

import type { ContentPart } from "@tanstack/ai";
import { ArrowUp, CircleStop, Paperclip, X } from "lucide-react";
import {
  type ChangeEvent,
  type ClipboardEvent,
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
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  pendingFilesToContentParts,
  usePendingFiles,
} from "../hooks/use-pending-files";
import { AiChatImagePreview } from "./ai-chat-image-preview";
import { AiChatInputGlow } from "./ai-chat-input-glow";
import { AiChatPendingFiles } from "./ai-chat-pending-files";

interface AiChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (parts?: ContentPart[]) => void;
  onStop: () => void;
  isLoading: boolean;
  disabled?: boolean;
  placeholder?: string;
  hasMessages?: boolean;
  acceptedFileTypes?: string;
  quotedText?: string | null;
  onClearQuote?: () => void;
  ref?: Ref<AiChatInputHandle>;
}

export interface AiChatInputHandle {
  focus: () => void;
  addFiles: (files: FileList | File[]) => void;
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
  acceptedFileTypes,
  quotedText,
  onClearQuote,
  ref,
}: AiChatInputProps) {
  const { t } = useTranslation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  const displayPlaceholder = placeholder ?? t("shell_input_placeholder");

  const attachmentsEnabled = !!acceptedFileTypes;

  const {
    files: pendingFiles,
    add: addFiles,
    remove: removeFile,
    clear: clearFiles,
  } = usePendingFiles();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useImperativeHandle(ref, () => ({
    focus: () => textareaRef.current?.focus(),
    addFiles,
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

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) addFiles(e.target.files);
    // reset so picking the same file twice in a row still fires onChange
    e.target.value = "";
  };

  const handlePaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    if (!attachmentsEnabled) return;
    const files = Array.from(e.clipboardData.items)
      .filter((item) => item.kind === "file")
      .map((item) => item.getAsFile())
      .filter((f): f is File => f !== null);
    if (files.length === 0) return;
    e.preventDefault();
    addFiles(files);
  };

  const submitMessage = async () => {
    if (!value.trim() && pendingFiles.length === 0) return;
    const filesSnapshot = pendingFiles;
    setPreviewUrl(null);
    clearFiles();
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (el) el.style.height = "auto";
    });
    const parts = await pendingFilesToContentParts(filesSnapshot);
    onSubmit(parts);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void submitMessage();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void submitMessage();
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

  const pendingFilesChips = attachmentsEnabled ? (
    <AiChatPendingFiles
      files={pendingFiles}
      onRemove={removeFile}
      onPreview={setPreviewUrl}
    />
  ) : null;

  const quoteChip = quotedText ? (
    <div className="flex items-center px-3 pt-2">
      <div className="inline-flex items-center gap-1.5 rounded-lg bg-ai-chat-muted px-2 py-1.5 text-xs text-ai-chat-muted-foreground max-w-full min-w-0">
        <span className="truncate">{quotedText}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={onClearQuote}
          className="shrink-0 hover:bg-ai-chat-border"
          aria-label={t("remove_quoted_text")}
        >
          <X aria-hidden="true" />
        </Button>
      </div>
    </div>
  ) : null;

  const plusMenu = attachmentsEnabled ? (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="flex-shrink-0 hover:bg-ai-chat-muted text-ai-chat-muted-foreground"
          aria-label={t("add_attachment")}
        >
          <Paperclip aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top">
        <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
          {t("upload_files")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ) : null;

  const sendStopButton = isLoading ? (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="flex-shrink-0"
          onClick={onStop}
          aria-label={t("stop")}
        >
          <CircleStop className="size-5 text-foreground" aria-hidden="true" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{t("stop")}</TooltipContent>
    </Tooltip>
  ) : (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="submit"
          variant="ghost"
          size="icon"
          disabled={(!value.trim() && pendingFiles.length === 0) || disabled}
          className="flex-shrink-0 text-white hover:text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: "var(--ai-gradient-strong)" }}
          aria-label={t("send")}
        >
          <ArrowUp className="size-5" aria-hidden="true" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{t("send")}</TooltipContent>
    </Tooltip>
  );

  return (
    <div className="relative z-10 mt-auto pt-3 px-4">
      {attachmentsEnabled && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={acceptedFileTypes}
            hidden
            onChange={handleFileSelect}
          />
          <AiChatImagePreview
            url={previewUrl}
            onClose={() => setPreviewUrl(null)}
          />
        </>
      )}
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
            {quoteChip}
            {pendingFilesChips}
            <div className="flex items-end gap-2 pl-[8px] pr-[8px] pt-[4px] pb-[8px]">
              {plusMenu}
              <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => handleChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
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
            {quoteChip}
            {pendingFilesChips}
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder={displayPlaceholder}
              aria-label={displayPlaceholder}
              className="w-full resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none h-[80px] px-[22px] pt-5 pb-2 leading-relaxed"
              rows={1}
              disabled={disabled}
            />
            <div
              className={cn(
                "flex items-center px-[8px] pb-[8px]",
                plusMenu ? "justify-between" : "justify-end",
              )}
            >
              {plusMenu}
              {sendStopButton}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
