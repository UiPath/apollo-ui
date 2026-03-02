"use client";

import { cn } from "@/lib/utils";
import type { ChoiceOption } from "../utils/ai-chat-tool-types";

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
      {prompt && <p className="text-sm text-muted-foreground">{prompt}</p>}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            className={cn(
              "h-auto py-2 px-3 text-left max-w-full text-sm rounded-lg border transition-colors hover:opacity-80",
              option.recommended && "border-2 border-primary",
            )}
            onClick={() => onSelect(option)}
          >
            <span className="font-medium truncate">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
