"use client";

import { Button } from "@/components/ui/button";

interface AiChatEmptySuggestionsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
}

export function AiChatEmptySuggestions({
  suggestions,
  onSelect,
}: AiChatEmptySuggestionsProps) {
  if (suggestions.length === 0) return null;
  return (
    <div className="mt-4 px-4 flex flex-wrap justify-center gap-2">
      {suggestions.map((suggestion) => (
        <Button
          key={suggestion}
          type="button"
          variant="outline"
          size="sm"
          className="rounded-full text-xs font-semibold"
          onClick={() => onSelect(suggestion)}
        >
          {suggestion}
        </Button>
      ))}
    </div>
  );
}
