"use client";

import type { AnyClientTool } from "@tanstack/ai";
import type { TextPart, ToolCallPart, UIMessage } from "@tanstack/ai-client";
import { Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ToolRenderers } from "../types";
import { AiChatMarkdown } from "./ai-chat-markdown";

function getToolRenderer<
  TTools extends ReadonlyArray<AnyClientTool>,
  TName extends TTools[number]["name"],
>(
  renderers: ToolRenderers<TTools> | undefined,
  name: TName,
): ToolRenderers<TTools>[TName] | undefined {
  if (!renderers) return;
  return renderers[name];
}

interface AiChatMessageProps<
  TTools extends ReadonlyArray<AnyClientTool> = ReadonlyArray<AnyClientTool>,
> {
  message: UIMessage<TTools>;
  toolRenderers?: ToolRenderers<TTools>;
  assistantName?: string;
}

function getDisplayText(message: UIMessage): string {
  return message.parts
    .filter((p): p is TextPart => p.type === "text")
    .map((p) => p.content)
    .join("");
}

function tryParseJSON(str: string): unknown {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

export function AiChatMessage<
  TTools extends ReadonlyArray<AnyClientTool> = ReadonlyArray<AnyClientTool>,
>({ message, toolRenderers, assistantName }: AiChatMessageProps<TTools>) {
  const { t } = useTranslation();
  const isUser = message.role === "user";
  const displayName = assistantName ?? t("ai_assistant");
  const displayContent = getDisplayText(message);

  const toolCallParts = message.parts.filter(
    (p): p is ToolCallPart<TTools> => p.type === "tool-call",
  );

  const displayRenders = toolCallParts.flatMap((tc) => {
    const render = getToolRenderer(toolRenderers, tc.name);
    if (!render) return [];

    if (tc.input != null) {
      const rendered = render(tc.input);
      if (!rendered) return [];
      return [<div key={tc.id}>{rendered}</div>];
    }

    const parsed = tryParseJSON(tc.arguments);
    if (parsed == null) return [];
    const rendered = render(parsed as Parameters<typeof render>[0]);
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
