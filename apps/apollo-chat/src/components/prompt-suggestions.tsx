"use client";

import { cn } from "@/lib/utils";

export interface PromptSuggestion {
  id: string;
  label: string;
}

interface PromptSuggestionsProps {
  className?: string;
  suggestions?: PromptSuggestion[];
  onSelect?: (suggestion: PromptSuggestion) => void;
}

export function PromptSuggestions({
  className,
  suggestions = [],
  onSelect,
}: PromptSuggestionsProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className={cn("flex flex-col items-start gap-2", className)}>
      {suggestions.map((suggestion) => (
        <button
          key={suggestion.id}
          type="button"
          className="flex h-10 items-center rounded-xl border border-border-subtle bg-surface-raised px-4 py-2.5 text-sm font-normal leading-5 text-foreground-secondary transition-colors hover:border-border-hover hover:bg-surface-hover hover:text-foreground"
          onClick={() => onSelect?.(suggestion)}
        >
          {suggestion.label}
        </button>
      ))}
    </div>
  );
}
