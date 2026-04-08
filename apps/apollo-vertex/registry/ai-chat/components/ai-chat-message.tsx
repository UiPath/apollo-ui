"use client";

import type { TextPart, ToolCallPart, UIMessage } from "@tanstack/ai-client";
import { Loader2, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { AiChatMarkdown } from "./ai-chat-markdown";

interface ToolCallRenderProps {
  id: string;
  name: string;
  output: unknown;
}

export type ToolsRenderer = Record<
  string,
  (props: ToolCallRenderProps) => ReactNode
>;

interface AiChatMessageProps {
  message: UIMessage;
  assistantName?: string;
  children?: ReactNode;
  toolsRenderer?: ToolsRenderer;
}

function getDisplayText(message: UIMessage): string {
  return message.parts
    .filter((p): p is TextPart => p.type === "text")
    .map((p) => p.content)
    .join("");
}

function AiChatToolLoading() {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground py-1">
      <Loader2 className="size-3 animate-spin" aria-hidden="true" />
      <span>{"Loading..."}</span>
    </div>
  );
}

export function AiChatMessage({
  message,
  assistantName,
  children,
  toolsRenderer,
}: AiChatMessageProps) {
  const { t } = useTranslation();
  const isUser = message.role === "user";
  const displayName = assistantName ?? t("ai_assistant");
  const displayContent = getDisplayText(message);

  const toolRenders = isUser
    ? []
    : message.parts
        .filter((p): p is ToolCallPart => p.type === "tool-call")
        .flatMap((tc) => {
          const renderer = toolsRenderer?.[tc.name];
          if (!renderer) return [];

          if (tc.output == null) {
            return [<AiChatToolLoading key={tc.id} />];
          }

          return [
            <div key={tc.id}>
              {renderer({ id: tc.id, name: tc.name, output: tc.output })}
            </div>,
          ];
        });

  const hasToolContent = toolRenders.length > 0;

  // Don't render assistant messages if they have no text content, no children, and no tool content
  if (!isUser && !displayContent && !children && !hasToolContent) {
    return null;
  }

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
      <div className="flex flex-col gap-1 max-w-[85%]">
        <span className="text-xs text-muted-foreground font-medium">
          {displayName}
        </span>
        {displayContent && <AiChatMarkdown>{displayContent}</AiChatMarkdown>}
        {hasToolContent && (
          <div className="mt-2 flex flex-col gap-2">{toolRenders}</div>
        )}
        {children && <div className="mt-2 flex flex-col gap-2">{children}</div>}
      </div>
    </div>
  );
}
