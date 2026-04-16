"use client";

import type { ReactNode } from "react";

interface AiChatEmptyStateProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
}

export function AiChatEmptyState({
  title = "How can I help you?",
  description,
  icon,
}: AiChatEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center text-ai-chat-muted-foreground gap-4">
      {icon}
      <div className="flex flex-col items-center gap-1">
        <h2 className="text-2xl font-semibold leading-tight tracking-tight text-foreground">
          {title}
        </h2>
        {description && (
          <p className="text-sm text-muted-foreground max-w-sm">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
