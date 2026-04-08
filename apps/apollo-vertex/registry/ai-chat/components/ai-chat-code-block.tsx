"use client";

import { Check, ClipboardCopy } from "lucide-react";
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/registry/tooltip/tooltip";

const COPY_LABEL = "Copy code";
const COPIED_LABEL = "Copied!";

interface AiChatCodeBlockProps {
  children: string;
  language?: string;
}

export function AiChatCodeBlock({ children, language }: AiChatCodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyLabel = copied ? COPIED_LABEL : COPY_LABEL;

  return (
    <div className="relative group/codeblock mb-2 last:mb-0 rounded-lg bg-ai-chat-muted overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-ai-chat-border">
        {language && (
          <span className="text-[11px] font-mono text-ai-chat-muted-foreground uppercase tracking-wider">
            {language}
          </span>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={handleCopy}
              className="ml-auto size-6 inline-flex items-center justify-center rounded-md opacity-0 group-hover/codeblock:opacity-100 transition-opacity hover:bg-ai-chat-border"
              aria-label={copyLabel}
            >
              {copied ? (
                <Check className="size-3 text-success" aria-hidden="true" />
              ) : (
                <ClipboardCopy
                  className="size-3 text-ai-chat-muted-foreground"
                  aria-hidden="true"
                />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent>{copyLabel}</TooltipContent>
        </Tooltip>
      </div>
      <pre className="p-3 overflow-x-auto">
        <code className="text-xs font-mono text-ai-chat-foreground">
          {children}
        </code>
      </pre>
    </div>
  );
}
