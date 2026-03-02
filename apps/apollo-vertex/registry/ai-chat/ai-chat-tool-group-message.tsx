"use client";

import { Sparkles } from "lucide-react";
import { AiChatToolGroup } from "./ai-chat-tool-group";
import type { ToolCall } from "@/lib/ai-chat-types";

interface AiChatToolGroupMessageProps {
  toolCalls: ToolCall[];
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
  return (
    <div className="flex w-full justify-start gap-3">
      <div className="size-8 flex items-center justify-center flex-shrink-0 rounded-full bg-primary">
        <Sparkles className="size-4 text-primary-foreground" />
      </div>
      <div className="flex flex-col gap-1 w-[85%]">
        <span className="text-xs text-muted-foreground font-medium">
          {assistantName}
        </span>
        <AiChatToolGroup
          toolCalls={toolCalls}
          isLatest={isLatest}
          toolDisplayNames={toolDisplayNames}
        />
      </div>
    </div>
  );
}
