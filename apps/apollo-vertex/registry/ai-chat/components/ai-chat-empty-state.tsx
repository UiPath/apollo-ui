"use client";

import type { ReactNode } from "react";
import { Button } from "@/registry/button/button";
import { AutopilotIcon } from "./icons/autopilot";

interface AiChatEmptyStateProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  suggestions?: string[];
  onSuggestionClick?: (suggestion: string) => void;
}

export function AiChatEmptyState({
  title = "How can I help you?",
  description,
  icon,
  suggestions,
  onSuggestionClick,
}: AiChatEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center text-ai-chat-muted-foreground gap-4">
      {icon ?? (
        <AutopilotIcon
          size={32}
          className="text-foreground"
          aria-hidden="true"
        />
      )}
      <div className="flex flex-col items-center gap-1">
        <h2 className="text-xl font-bold leading-tight tracking-tight text-foreground">
          {title}
        </h2>
        {description && (
          <p className="text-sm text-muted-foreground max-w-sm">
            {description}
          </p>
        )}
      </div>
      {suggestions && suggestions.length > 0 && onSuggestionClick && (
        <div className="flex flex-wrap justify-center gap-2 max-w-md">
          {suggestions.map((suggestion) => (
            <Button
              key={suggestion}
              variant="outline"
              size="sm"
              className="border-ai-chat-border text-ai-chat-foreground hover:bg-ai-chat-muted"
              onClick={() => onSuggestionClick(suggestion)}
            >
              {suggestion}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
