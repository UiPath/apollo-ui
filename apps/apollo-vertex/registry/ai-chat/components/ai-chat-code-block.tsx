"use client";

import "highlight.js/styles/github.min.css";

import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import css from "highlight.js/lib/languages/css";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import python from "highlight.js/lib/languages/python";
import sql from "highlight.js/lib/languages/sql";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/registry/tooltip/tooltip";

hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("js", javascript);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("ts", typescript);
hljs.registerLanguage("tsx", typescript);
hljs.registerLanguage("jsx", javascript);
hljs.registerLanguage("python", python);
hljs.registerLanguage("py", python);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("sh", bash);
hljs.registerLanguage("shell", bash);
hljs.registerLanguage("json", json);
hljs.registerLanguage("css", css);
hljs.registerLanguage("html", xml);
hljs.registerLanguage("xml", xml);
hljs.registerLanguage("sql", sql);

const COPY_LABEL = "Copy code";
const COPIED_LABEL = "Copied!";

interface AiChatCodeBlockProps {
  children: string;
  language?: string;
}

export function AiChatCodeBlock({ children, language }: AiChatCodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const highlightedHtml =
    language && hljs.getLanguage(language)
      ? hljs.highlight(children, { language }).value
      : hljs.highlightAuto(children).value;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyLabel = copied ? COPIED_LABEL : COPY_LABEL;

  return (
    <div className="relative group/codeblock mb-2 last:mb-0 rounded-lg bg-ai-chat-muted/50 overflow-hidden">
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
                <Copy
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
        <code
          className="hljs text-xs font-mono"
          dangerouslySetInnerHTML={{ __html: highlightedHtml }}
        />
      </pre>
    </div>
  );
}
