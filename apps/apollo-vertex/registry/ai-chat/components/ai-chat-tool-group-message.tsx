"use client";

import { Sparkles } from "lucide-react";
import type { ToolCallPart } from "@tanstack/ai-client";
import { AiChatToolGroup } from "./ai-chat-tool-group";

interface AiChatToolGroupMessageProps {
  toolCalls: ToolCallPart[];
  isLatest: boolean;
  assistantName: string;
  toolDisplayNames?: Record<string, string>;
}

export function AiChatToolGroupMessage({
  toolCalls,
  isLatest,
  assistantName,
  toolDisplayNames,
}: AiChatToolGroupMessageProps) {
  const visibleToolCalls = toolDisplayNames
    ? toolCalls.filter((tc) => (toolDisplayNames[tc.name] ?? tc.name) !== "")
    : toolCalls;

  if (visibleToolCalls.length === 0) return null;

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
          {assistantName}
        </span>
        <AiChatToolGroup
          toolCalls={visibleToolCalls}
          isLatest={isLatest}
          toolDisplayNames={toolDisplayNames}
        />
      </div>
    </div>
  );
}
