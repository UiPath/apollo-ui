// oxlint-disable eslint/max-lines -- input bundles file handling, paste, quote chip, and lightbox portal; split would add indirection
"use client";

import {
  ArrowUp,
  CircleStop,
  FileText,
  MessageSquareText,
  Plus,
  X,
} from "lucide-react";
import {
  type ClipboardEvent,
  type FocusEvent,
  type FormEvent,
  forwardRef,
  type KeyboardEvent,
  type Ref,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/registry/button/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/registry/dropdown-menu/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/registry/tooltip/tooltip";

interface PendingFile {
  uid: string;
  name: string;
  size: number;
  type: string;
  file: File;
  thumbnailUrl?: string;
}

interface AiChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (files?: File[]) => void;
  onStop: () => void;
  isLoading: boolean;
  disabled?: boolean;
  placeholder?: string;
  hasMessages?: boolean;
  maxLength?: number;
  initialFiles?: PendingFile[];
  quotedText?: string | null;
  onClearQuote?: () => void;
}

function makePendingFile(file: File, nameOverride?: string): PendingFile {
  const uid = crypto.randomUUID();
  const name = nameOverride ?? file.name;
  if (file.type.startsWith("image/")) {
    return {
      uid,
      name,
      size: file.size,
      type: file.type,
      file,
      thumbnailUrl: URL.createObjectURL(file),
    };
  }
  return { uid, name, size: file.size, type: file.type, file };
}

export interface AiChatInputHandle {
  focus: () => void;
}

export const AiChatInput = forwardRef<AiChatInputHandle, AiChatInputProps>(
  function AiChatInput(
    {
      value,
      onChange,
      onSubmit,
      onStop,
      isLoading,
      disabled = false,
      placeholder,
      hasMessages = false,
      maxLength,
      initialFiles = [],
      quotedText,
      onClearQuote,
    }: AiChatInputProps,
    ref: Ref<AiChatInputHandle>,
  ) {
    const { t } = useTranslation();
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const glowRef = useRef<HTMLDivElement>(null);
    const [pendingFiles, setPendingFiles] =
      useState<PendingFile[]>(initialFiles);
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

    useEffect(() => {
      if (!lightboxUrl) return;
      const handler = (e: globalThis.KeyboardEvent) => {
        if (e.key === "Escape") setLightboxUrl(null);
      };
      document.addEventListener("keydown", handler);
      return () => document.removeEventListener("keydown", handler);
    }, [lightboxUrl]);

    useImperativeHandle(ref, () => ({
      focus: () => textareaRef.current?.focus({ preventScroll: true }),
    }));
    const displayPlaceholder = placeholder ?? "Start with a task or goal";

    const adjustHeight = () => {
      if (!hasMessages) return;
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
      if (!value.trim()) return;
      const files = pendingFiles.map((f) => f.file);
      if (files.length > 0) onSubmit(files);
      else onSubmit();
      pendingFiles.forEach((f) => {
        if (f.thumbnailUrl) URL.revokeObjectURL(f.thumbnailUrl);
      });
      setPendingFiles([]);
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

    const handleFileClick = () => {
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.multiple = true;
      fileInput.addEventListener("change", () => {
        if (!fileInput.files) return;
        const newFiles = Array.from(fileInput.files).map((file) =>
          makePendingFile(file),
        );
        setPendingFiles((prev) => [...prev, ...newFiles]);
      });
      fileInput.click();
    };

    const removeFile = (index: number) => {
      setPendingFiles((prev) => {
        const removed = prev[index];
        if (removed?.thumbnailUrl) URL.revokeObjectURL(removed.thumbnailUrl);
        return prev.filter((_, i) => i !== index);
      });
    };

    const handlePaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
      const imageFiles: PendingFile[] = Array.from(e.clipboardData.items)
        .filter(
          (item) => item.kind === "file" && item.type.startsWith("image/"),
        )
        .flatMap((item) => {
          const file = item.getAsFile();
          if (!file) return [];
          const name =
            file.name === ""
              ? `pasted-image.${file.type.split("/")[1]}`
              : file.name;
          return [makePendingFile(file, name)];
        });
      if (imageFiles.length > 0) {
        e.preventDefault();
        setPendingFiles((prev) => [...prev, ...imageFiles]);
      }
    };

    const focusStyles = {
      onFocusCapture: (e: FocusEvent<HTMLFormElement>) => {
        const el = e.currentTarget;
        el.style.borderColor = "transparent";
        el.style.backgroundImage = `linear-gradient(var(--background), var(--background)), var(--ai-gradient-strong)`;
        el.style.backgroundOrigin = "border-box";
        el.style.backgroundClip = "padding-box, border-box";
        el.style.boxShadow =
          "0 0 0 3px color-mix(in oklch, var(--muted-foreground) 10%, transparent)";
        if (glowRef.current) glowRef.current.style.opacity = "0";
      },
      onBlurCapture: (e: FocusEvent<HTMLFormElement>) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
          const el = e.currentTarget;
          el.style.borderColor = "";
          el.style.backgroundImage = "";
          el.style.backgroundOrigin = "";
          el.style.backgroundClip = "";
          el.style.boxShadow = "";
          if (glowRef.current) glowRef.current.style.opacity = "";
        }
      },
    };

    const quoteChip = quotedText && (
      <div className="flex items-start gap-2 mx-[10px] mt-2 px-2 py-1.5 rounded-md bg-muted/50 text-xs text-muted-foreground">
        <MessageSquareText
          className="size-3 flex-shrink-0 mt-0.5 opacity-60"
          aria-hidden="true"
        />
        <span className="flex-1 line-clamp-2 leading-relaxed">
          {quotedText}
        </span>
        <button
          type="button"
          onClick={onClearQuote}
          className="flex-shrink-0 size-4 rounded-sm flex items-center justify-center hover:bg-muted-foreground/20 mt-0.5"
          aria-label="Remove quote"
        >
          <X className="size-2.5" aria-hidden="true" />
        </button>
      </div>
    );

    const fileChips = pendingFiles.length > 0 && (
      <div className="flex flex-wrap gap-1.5 px-[10px] pt-2">
        {pendingFiles.map((f, i) => (
          <div
            key={f.uid}
            className="relative flex items-center gap-1 rounded-md bg-muted text-xs text-foreground overflow-hidden"
          >
            {f.thumbnailUrl ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    if (f.thumbnailUrl) setLightboxUrl(f.thumbnailUrl);
                  }}
                  className="flex-shrink-0 focus:outline-none"
                  aria-label={`Preview ${f.name}`}
                >
                  <img
                    src={f.thumbnailUrl}
                    alt={f.name}
                    className="size-10 object-cover border border-border hover:opacity-90 transition-opacity"
                  />
                </button>
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="absolute top-0.5 right-0.5 size-4 rounded-sm flex items-center justify-center bg-black/50 hover:bg-black/70 text-white"
                  aria-label={`Remove ${f.name}`}
                >
                  <X className="size-2.5" aria-hidden="true" />
                </button>
              </>
            ) : (
              <>
                <div className="pl-2 flex items-center gap-1 max-w-[180px] py-1">
                  <FileText
                    className="size-3 flex-shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <span className="truncate">{f.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="flex-shrink-0 size-4 rounded-sm flex items-center justify-center hover:bg-muted-foreground/20 mr-1"
                  aria-label={`Remove ${f.name}`}
                >
                  <X className="size-2.5" aria-hidden="true" />
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    );

    const plusMenu = (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="flex-shrink-0 text-muted-foreground hover:text-foreground"
          >
            <Plus className="size-4" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="top">
          <DropdownMenuItem onClick={handleFileClick}>
            {"Upload files"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

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
      <>
        <div className="relative z-10 mt-auto pt-3 px-4">
          <div className="relative">
            <div
              ref={glowRef}
              className={`absolute pointer-events-none transition-opacity duration-500 ${hasMessages ? "opacity-0" : "opacity-100"}`}
              style={{
                top: "-56px",
                left: "-48px",
                right: "-48px",
                bottom: "-64px",
              }}
              aria-hidden="true"
            >
              <svg
                viewBox="0 0 561 176"
                preserveAspectRatio="none"
                className="w-full h-full"
                style={{ overflow: "visible" }}
                aria-hidden="true"
              >
                <defs>
                  <filter
                    id="ai-chat-input-glow"
                    x="-25%"
                    y="-50%"
                    width="150%"
                    height="200%"
                  >
                    <feGaussianBlur stdDeviation="10" />
                  </filter>
                  <linearGradient
                    id="ai-chat-input-gradient"
                    x1="375.705"
                    y1="97.1886"
                    x2="356.926"
                    y2="19.642"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#69C7DD" />
                    <stop offset="1" stopColor="#6C5AEF" />
                  </linearGradient>
                </defs>
                <path
                  d="M124.909 87.7963L40.0002 119.001L40.0471 121.245L88.6762 130.906C132.72 132.472 223.153 135.555 232.53 135.359C244.251 135.113 315.666 133.619 447.602 128.917C579.537 124.214 504.087 109.289 446.803 90.7685C428.089 88.9151 405.086 89.6999 383 82.3956C360.914 75.0913 357.352 70.9186 338.481 61.6054C319.611 52.2922 308.392 55.8035 286.366 51.4103C264.341 47.0172 245.606 44.1934 181.911 40.9756C118.215 37.7579 138.966 43.5125 129.849 43.7033C122.556 43.8559 113.044 50.082 109.2 53.176L124.454 66.084L124.909 87.7963Z"
                  fill="url(#ai-chat-input-gradient)"
                  fillOpacity="0.25"
                  filter="url(#ai-chat-input-glow)"
                />
              </svg>
            </div>
            {hasMessages ? (
              <form
                onSubmit={handleSubmit}
                className="relative flex flex-col rounded-lg border-2 border-input transition-colors bg-background"
                {...focusStyles}
              >
                {quoteChip}
                {fileChips}
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
              <form
                onSubmit={handleSubmit}
                className="relative flex flex-col rounded-lg border-2 border-input transition-colors bg-background"
                {...focusStyles}
              >
                {quoteChip}
                {fileChips}
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
                <div className="flex items-center justify-between px-[8px] pb-[8px]">
                  {plusMenu}
                  {sendStopButton}
                </div>
              </form>
            )}
          </div>
        </div>
        {lightboxUrl &&
          createPortal(
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
              onClick={() => setLightboxUrl(null)}
              role="dialog"
              aria-modal="true"
              aria-label="Image preview"
            >
              <button
                type="button"
                className="absolute top-4 right-4 size-8 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-colors"
                onClick={() => setLightboxUrl(null)}
                aria-label="Close preview"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
              <img
                src={lightboxUrl}
                alt="Preview"
                className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
            </div>,
            document.body,
          )}
      </>
    );
  },
);
