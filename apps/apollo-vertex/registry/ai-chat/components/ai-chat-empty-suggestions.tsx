"use client";

import { Button } from "@/components/ui/button";

/** A suggestion is either shown and submitted verbatim (a plain string), or
 * given a shorter display label while still submitting the full sentence
 * (e.g. a landing page deriving a short label from request history). */
type AiChatSuggestion = string | { label: string; value: string };

interface AiChatEmptySuggestionsProps {
  suggestions: AiChatSuggestion[];
  onSelect: (suggestion: string) => void;
}

export function AiChatEmptySuggestions({
  suggestions,
  onSelect,
}: AiChatEmptySuggestionsProps) {
  if (suggestions.length === 0) return null;
  return (
    <div className="mt-4 px-4 flex flex-wrap justify-center gap-2">
      {suggestions.map((suggestion) => {
        const label =
          typeof suggestion === "string" ? suggestion : suggestion.label;
        const value =
          typeof suggestion === "string" ? suggestion : suggestion.value;
        return (
          <Button
            key={value}
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full text-xs font-semibold"
            onClick={() => onSelect(value)}
          >
            {label}
          </Button>
        );
      })}
    </div>
  );
}
