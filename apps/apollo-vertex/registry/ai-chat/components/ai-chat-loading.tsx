"use client";

import { Sparkles } from "lucide-react";
import { Avatar, AvatarFallback } from "@/registry/avatar/avatar";
import { Skeleton } from "@/registry/skeleton/skeleton";
import { useAiChat } from "./ai-chat-provider";

type LoadingVariant = "skeleton" | "dots";

interface AiChatLoadingProps {
  assistantName?: string;
  loadingVariant?: LoadingVariant;
}

export function AiChatLoading({
  assistantName,
  loadingVariant = "skeleton",
}: AiChatLoadingProps) {
  const config = useAiChat();
  const displayName = assistantName ?? config.assistantName;

  return (
    <div className="flex justify-start gap-3">
      <Avatar className="size-8 flex-shrink-0">
        <AvatarFallback className="bg-ai-chat-accent">
          {config.assistantAvatar ?? (
            <Sparkles
              className="size-4 text-ai-chat-accent-foreground"
              aria-hidden="true"
            />
          )}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col gap-1">
        <span className="text-xs text-ai-chat-muted-foreground font-medium">
          {displayName}
        </span>
        {loadingVariant === "skeleton" ? (
          <div className="flex flex-col gap-2 py-2">
            <Skeleton className="h-3 w-[80%] bg-ai-chat-muted" />
            <Skeleton className="h-3 w-[60%] bg-ai-chat-muted" />
            <Skeleton className="h-3 w-[40%] bg-ai-chat-muted" />
          </div>
        ) : (
          <div className="px-4 py-3 rounded-lg bg-ai-chat-bubble-assistant">
            <div className="flex gap-1">
              <span className="size-2 bg-ai-chat-accent rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="size-2 bg-ai-chat-accent rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="size-2 bg-ai-chat-accent rounded-full animate-bounce" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
