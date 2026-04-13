"use client";

import "highlight.js/styles/github.min.css";

// Dark-mode override: github-dark-dimmed palette scoped to `.dark`
const DARK_HLJS_STYLE = `
.dark .hljs {
  color: #adbac7;
  background: transparent;
}
.dark .hljs-doctag,.dark .hljs-keyword,.dark .hljs-meta .hljs-keyword,.dark .hljs-template-tag,.dark .hljs-template-variable,.dark .hljs-type,.dark .hljs-variable.language_ {
  color: #f47067;
}
.dark .hljs-title,.dark .hljs-title.class_,.dark .hljs-title.class_.inherited__,.dark .hljs-title.function_ {
  color: #dcbdfb;
}
.dark .hljs-attr,.dark .hljs-attribute,.dark .hljs-literal,.dark .hljs-meta,.dark .hljs-number,.dark .hljs-operator,.dark .hljs-variable,.dark .hljs-selector-attr,.dark .hljs-selector-class,.dark .hljs-selector-id {
  color: #6cb6ff;
}
.dark .hljs-regexp,.dark .hljs-string,.dark .hljs-meta .hljs-string {
  color: #96d0ff;
}
.dark .hljs-built_in,.dark .hljs-symbol {
  color: #f69d50;
}
.dark .hljs-comment,.dark .hljs-code,.dark .hljs-formula {
  color: #768390;
}
.dark .hljs-name,.dark .hljs-quote,.dark .hljs-selector-tag,.dark .hljs-selector-pseudo {
  color: #8ddb8c;
}
.dark .hljs-subst {
  color: #adbac7;
}
.dark .hljs-section {
  color: #316dca;
  font-weight: bold;
}
.dark .hljs-bullet {
  color: #eac55f;
}
.dark .hljs-emphasis {
  color: #adbac7;
  font-style: italic;
}
.dark .hljs-strong {
  color: #adbac7;
  font-weight: bold;
}
.dark .hljs-addition {
  color: #b4f1b4;
  background-color: #1b4721;
}
.dark .hljs-deletion {
  color: #ffd8d3;
  background-color: #78191b;
}
`;

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
    <>
      <style dangerouslySetInnerHTML={{ __html: DARK_HLJS_STYLE }} />
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
    </>
  );
}
