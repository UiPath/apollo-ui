"use client";

import { cn } from "@/lib/utils";
import {
  CornerRightUp,
  Mic,
  Plus,
  Settings2,
  Square,
  Workflow,
} from "lucide-react";
import { useRef } from "react";

interface ChatComposerProps {
  className?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop?: () => void;
  isStreaming?: boolean;
  disabled?: boolean;
}

export function ChatComposer({
  className,
  placeholder = "I would like you to automate my",
  value,
  onChange,
  onSubmit,
  onStop,
  isStreaming = false,
  disabled = false,
}: ChatComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (isStreaming) {
        onStop?.();
      } else if (value.trim()) {
        onSubmit();
      }
    }
  };

  const showSubmit = value.trim().length > 0 || isStreaming;

  return (
    <div
      className={cn(
        "w-full max-w-[800px] rounded-[32px] bg-surface-raised p-2",
        className
      )}
    >
      <div className="group/input flex flex-col gap-3 rounded-[24px] border border-border bg-surface pb-3 pl-4 pr-3 pt-4 transition-colors hover:border-border-hover focus-within:border-border-hover">
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          className="w-full resize-none bg-transparent text-sm font-normal leading-5 text-foreground placeholder:text-foreground-muted focus:outline-none focus:placeholder:text-foreground-secondary group-hover/input:placeholder:text-foreground-secondary"
          placeholder={placeholder}
          rows={3}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        {/* Toolbar */}
        <div className="flex items-center justify-between">
          {/* Left actions */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="group flex h-8 w-8 items-center justify-center rounded-lg hover:bg-surface-hover"
              aria-label="Add attachment"
            >
              <Plus className="h-5 w-5 text-foreground-muted group-hover:text-foreground-hover" />
            </button>
            <button
              type="button"
              className="group flex h-8 w-8 items-center justify-center rounded-lg hover:bg-surface-hover"
              aria-label="Add workflow"
            >
              <Workflow className="h-5 w-5 text-foreground-muted group-hover:text-foreground-hover" />
            </button>
            <button
              type="button"
              className="group flex h-8 w-8 items-center justify-center rounded-lg hover:bg-surface-hover"
              aria-label="Settings"
            >
              <Settings2 className="h-5 w-5 text-foreground-muted group-hover:text-foreground-hover" />
            </button>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {!isStreaming && (
              <button
                type="button"
                className="group flex h-8 w-8 items-center justify-center rounded-lg hover:bg-surface-hover"
                aria-label="Voice input"
              >
                <Mic className="h-5 w-5 text-foreground-muted group-hover:text-foreground-hover" />
              </button>
            )}

            {showSubmit ? (
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground-accent hover:bg-foreground-accent-muted"
                onClick={isStreaming ? onStop : onSubmit}
                aria-label={isStreaming ? "Stop" : "Submit"}
              >
                {isStreaming ? (
                  <Square className="h-4 w-4 fill-foreground-on-accent text-foreground-on-accent" />
                ) : (
                  <CornerRightUp className="h-5 w-5 text-foreground-on-accent" />
                )}
              </button>
            ) : (
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-hover group-focus-within/input:bg-foreground-accent hover:bg-foreground-accent-muted"
                aria-label="Voice input"
              >
                <Mic className="h-5 w-5 text-foreground-on-accent" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
