"use client";

import { cn } from "@/lib/utils";
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
    <div className="mt-4 space-y-2">
      {prompt && (
        <p className="text-xs text-muted-foreground">{prompt}</p>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            className={cn(
              "h-auto py-2 px-4 text-left max-w-full rounded-full text-xs font-semibold transition-all hover:scale-[1.02]",
              option.recommended
                ? "text-white border-0"
                : "border border-input bg-background text-foreground hover:bg-muted",
            )}
            style={option.recommended ? { background: "var(--ai-gradient-strong)" } : {}}
            onClick={() => onSelect(option)}
          >
            <span className="truncate">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
