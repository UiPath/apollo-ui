"use client";

import { Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { TextPart, ToolCallPart, UIMessage } from "@tanstack/ai-client";
import type { DisplayTool, ToolRenderers } from "../types";
import { AiChatMarkdown } from "./ai-chat-markdown";

interface AiChatMessageProps {
  message: UIMessage;
  toolRenderers?: ToolRenderers;
  assistantName?: string;
}

function getDisplayText(message: UIMessage): string {
  return message.parts
    .filter((p): p is TextPart => p.type === "text")
    .map((p) => p.content)
    .join("");
}

function renderToolCall(tc: ToolCallPart, tool: DisplayTool) {
  const raw = tc.input ?? tryParseJSON(tc.arguments);
  if (raw == null) return null;
  const result = tool.inputSchema.safeParse(raw);
  if (!result.success) return null;
  return tool.render(result.data);
}

function tryParseJSON(str: string): unknown {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

export function AiChatMessage({
  message,
  toolRenderers,
  assistantName,
}: AiChatMessageProps) {
  const { t } = useTranslation();
  const isUser = message.role === "user";
  const displayName = assistantName ?? t("ai_assistant");
  const displayContent = getDisplayText(message);

  const toolCallParts = message.parts.filter(
    (p): p is ToolCallPart => p.type === "tool-call",
  );

  const displayRenders = toolCallParts.flatMap((tc) => {
    const tool = toolRenderers?.[tc.name];
    if (!tool) return [];
    const rendered = renderToolCall(tc, tool);
    if (!rendered) return [];
    return [<div key={tc.id}>{rendered}</div>];
  });

  if (!isUser && !displayContent && displayRenders.length === 0) return null;

  if (isUser) {
    return (
      <div className="flex w-full justify-end">
        <div className="max-w-[80%] px-4 py-3 text-sm rounded-lg border border-border bg-muted/50">
          {displayContent && (
            <p className="whitespace-pre-wrap">{displayContent}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full justify-start gap-3">
      <div className="size-8 flex items-center justify-center flex-shrink-0 rounded-full bg-primary">
        <Sparkles
          className="size-4 text-primary-foreground"
          aria-hidden="true"
        />
      </div>
      <div className="flex flex-col gap-1 w-[85%]">
        <span className="text-xs text-muted-foreground font-medium">
          {displayName}
        </span>
        {displayContent && <AiChatMarkdown>{displayContent}</AiChatMarkdown>}
        {displayRenders.length > 0 && (
          <div className="mt-2 flex flex-col gap-2">{displayRenders}</div>
        )}
      </div>
    </div>
  );
}
