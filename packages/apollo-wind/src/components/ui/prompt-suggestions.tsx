'use client';

import { cva } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '@/lib';

/**
 * Prompts the user can pick instead of typing, as a group of chips. `onSelect` receives the
 * suggestion; whether that sends it or puts it in the composer is the caller's call:
 *
 * ```tsx
 * <PromptSuggestions
 *   suggestions={[{ label: 'Summarize', prompt: 'Summarize this conversation' }]}
 *   onSelect={({ label, prompt }) => send(prompt ?? label)}
 * />
 * ```
 */

export interface PromptSuggestionsStrings {
  /** Accessible name of the group, and its visible title with `showLabel`. */
  label: string;
}

export const DEFAULT_PROMPT_SUGGESTIONS_STRINGS: PromptSuggestionsStrings = {
  label: 'Suggestions',
};

/** One chip. Shaped so a chat service's `{ label, prompt }` suggestions pass straight in. */
export interface PromptSuggestionItem {
  label: string;
  /** The text to send or prefill, when it differs from the label. */
  prompt?: string;
  /** Keys the chip. Defaults to `label`. */
  id?: string;
  /** Leading icon. */
  icon?: React.ReactNode;
}

export type PromptSuggestionsDensity = 'comfortable' | 'compact';

const promptSuggestionsListVariants = cva('flex min-w-0 gap-2', {
  variants: {
    orientation: {
      vertical: 'flex-col items-start',
      horizontal:
        // The inline padding keeps the end chips' focus rings inside the scroll clip.
        '-mx-1 scroll-fade-x snap-x snap-mandatory scroll-px-1 scrollbar-none overflow-x-auto overscroll-x-contain px-1 py-1',
    },
  },
  defaultVariants: {
    orientation: 'vertical',
  },
});

const promptSuggestionVariants = cva(
  'inline-flex max-w-full cursor-pointer items-center border border-border-subtle bg-surface-raised text-left font-normal text-foreground transition-colors hover:border-border hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      density: {
        comfortable: 'gap-2 px-4 py-2 text-sm leading-5 [&_svg]:size-4 rounded-xl',
        compact: 'gap-1.5 px-2 py-1 text-xs leading-4 [&_svg]:size-3.5 rounded-lg',
      },
      orientation: {
        vertical: 'whitespace-normal',
        horizontal: 'flex-none snap-start whitespace-nowrap',
      },
    },
    defaultVariants: {
      density: 'comfortable',
      orientation: 'vertical',
    },
  }
);

export type PromptSuggestionsOrientation = 'vertical' | 'horizontal';

export interface PromptSuggestionsProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect' | 'children'> {
  suggestions: PromptSuggestionItem[];
  onSelect?: (suggestion: PromptSuggestionItem) => void;
  orientation?: PromptSuggestionsOrientation;
  density?: PromptSuggestionsDensity;
  /** Shows `strings.label` as a title above the chips, as a chat does after a reply. */
  showLabel?: boolean;
  /** Slides the group in from below when it mounts. Only fades under reduced motion. */
  animated?: boolean;
  disabled?: boolean;
  /** Overrides for any subset of the English strings. */
  strings?: Partial<PromptSuggestionsStrings>;
}

/** Stacks vertically by default; `horizontal` keeps one row that scrolls when it overflows. */
const PromptSuggestions = React.forwardRef<HTMLDivElement, PromptSuggestionsProps>(
  (
    {
      className,
      suggestions,
      onSelect,
      orientation,
      density,
      showLabel = false,
      animated = false,
      disabled = false,
      strings,
      ...props
    },
    ref
  ) => {
    const labelId = React.useId();
    const resolvedOrientation = orientation ?? 'vertical';
    const resolvedDensity = density ?? 'comfortable';
    const text = { ...DEFAULT_PROMPT_SUGGESTIONS_STRINGS, ...strings };

    if (suggestions.length === 0) return null;

    return (
      // biome-ignore lint/a11y/useSemanticElements: role="group" names the chips without fieldset chrome
      <div
        ref={ref}
        role="group"
        aria-label={showLabel ? undefined : text.label}
        aria-labelledby={showLabel ? labelId : undefined}
        data-slot="prompt-suggestions"
        data-orientation={resolvedOrientation}
        data-density={resolvedDensity}
        className={cn(
          'flex w-full min-w-0 flex-col gap-1',
          animated && 'animate-slide-in-from-bottom',
          className
        )}
        {...props}
      >
        {showLabel && (
          <div
            id={labelId}
            data-slot="prompt-suggestions-label"
            className={cn(
              'text-start font-semibold text-foreground',
              resolvedDensity === 'compact' ? 'text-xs leading-4' : 'text-sm leading-5'
            )}
          >
            {text.label}
          </div>
        )}
        <div
          data-slot="prompt-suggestions-list"
          className={promptSuggestionsListVariants({ orientation: resolvedOrientation })}
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.id ?? suggestion.label}
              type="button"
              data-slot="prompt-suggestion"
              data-index={index}
              disabled={disabled}
              className={promptSuggestionVariants({
                density: resolvedDensity,
                orientation: resolvedOrientation,
              })}
              onClick={() => onSelect?.(suggestion)}
            >
              {suggestion.icon}
              <span className="min-w-0">{suggestion.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }
);
PromptSuggestions.displayName = 'PromptSuggestions';

export { PromptSuggestions, promptSuggestionsListVariants, promptSuggestionVariants };
