"use client";

import { Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import type {
  ChatMessage,
  TextPart,
  ToolCallPart,
} from "../utils/ai-chat-message-types";
import type { Tools } from "../utils/ai-chat-tool-types";
import { AiChatMarkdown } from "./ai-chat-markdown";

interface AiChatMessageProps {
  message: ChatMessage;
  tools?: Tools;
  assistantName?: string;
}

function getDisplayText(message: ChatMessage): string {
  if (message.role === "user")
    return message.content.map((p) => p.text).join("");
  if (message.role === "assistant") {
    return message.content
      .filter((p): p is TextPart => p.type === "text")
      .map((p) => p.text)
      .join("");
  }
  return "";
}

export function AiChatMessage({
  message,
  tools,
  assistantName,
}: AiChatMessageProps) {
  const { t } = useTranslation();
  const isUser = message.role === "user";
  const displayName = assistantName ?? t("ai_assistant");
  const displayContent = getDisplayText(message);

  const toolCallParts: ToolCallPart[] =
    message.role === "assistant"
      ? message.content.filter((p): p is ToolCallPart => p.type === "tool-call")
      : [];

  const displayRenders = toolCallParts.flatMap((tc) => {
    const tool = tools?.[tc.toolName];
    if (!tool || "execute" in tool) return [];
    const parsed = tool.inputSchema.safeParse(tc.args);
    const args = parsed.success ? parsed.data : tc.args;
    return [<div key={tc.toolCallId}>{tool.render(args)}</div>];
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
