import { cn } from '@/lib';

// ============================================================================
// Types
// ============================================================================

export interface PromptSuggestion {
  id: string;
  label: string;
}

export interface PromptSuggestionsProps {
  className?: string;
  /** List of suggestions to display */
  suggestions?: PromptSuggestion[];
  /** Callback when a suggestion is clicked */
  onSelect?: (suggestion: PromptSuggestion) => void;
}

// ============================================================================
// PromptSuggestions
// ============================================================================

/**
 * A vertical list of clickable prompt suggestion pills.
 *
 * Styled per the Delegate Figma spec: zinc-800 background with
 * zinc-700 border and zinc-50 text.
 */
export function PromptSuggestions({
  className,
  suggestions = [],
  onSelect,
}: PromptSuggestionsProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className={cn('flex flex-col items-start gap-2', className)}>
      {suggestions.map((suggestion) => (
        <button
          key={suggestion.id}
          className="flex h-10 items-center rounded-xl border border-border bg-surface-overlay px-4 py-2.5 text-sm font-medium leading-5 text-foreground transition-colors hover:bg-surface-hover"
          onClick={() => onSelect?.(suggestion)}
        >
          {suggestion.label}
        </button>
      ))}
    </div>
  );
}
