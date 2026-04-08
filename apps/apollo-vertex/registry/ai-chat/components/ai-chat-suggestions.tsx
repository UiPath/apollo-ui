"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/registry/badge/badge";
import { Button } from "@/registry/button/button";
import type { ChoiceOption } from "../types";

interface AiChatSuggestionsProps {
  prompt?: string;
  options: ChoiceOption[];
  onSelect: (option: ChoiceOption) => void;
}

export function AiChatSuggestions({
  prompt,
  options,
  onSelect,
}: AiChatSuggestionsProps) {
  return (
    <div className="space-y-2">
      {prompt && (
        <p className="text-sm text-ai-chat-muted-foreground">{prompt}</p>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Button
            key={option.id}
            type="button"
            variant={option.recommended ? "default" : "outline"}
            size="sm"
            className={cn(
              "h-auto py-2 px-3 text-left max-w-full transition-all hover:scale-[1.02]",
              option.recommended &&
                "bg-ai-chat-accent text-ai-chat-accent-foreground hover:bg-ai-chat-accent/90",
            )}
            onClick={() => onSelect(option)}
          >
            <span className="font-medium truncate">{option.label}</span>
            {option.recommended && (
              <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5">
                {"\u2605"}
              </Badge>
            )}
          </Button>
        ))}
      </div>
    </div>
  );
}
