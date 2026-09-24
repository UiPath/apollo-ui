'use client';

import { Search } from 'lucide-react';
import type * as React from 'react';
import { cn } from '@/lib';

export interface PickerSearchInputProps {
  value: string;
  onChange: (next: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  placeholder?: string;
  /** Accessible name for the input. Defaults to the placeholder. */
  'aria-label'?: string;
  /**
   * Pointer to the currently active option's element id. Forwarded to
   * the input as `aria-activedescendant` so screen readers announce the
   * highlighted row even though DOM focus stays on the input.
   */
  activeDescendantId?: string;
  inputRef?: React.Ref<HTMLInputElement>;
  listboxId?: string;
  dense?: boolean;
  /**
   * Rendered to the left of the search box, on the same row. Use for an
   * inline folder picker / scope chip so it shares chrome with the search
   * field instead of sitting in a separate banner above it.
   */
  leading?: React.ReactNode;
  /**
   * Rendered to the right of the search box, on the same row. Use for
   * tiny end-aligned controls like the group-by toggle.
   */
  trailing?: React.ReactNode;
  /** Optional className forwarded to the outer wrapper for host overrides. */
  className?: string;
  'data-testid'?: string;
}

/**
 * Toolbar row above the option list: three distinct controls side by
 * side — [folder pill] [bordered search box] [group-by pills] — each
 * with its own chrome.
 *
 * This is a plain input rather than a `CommandInput`: filtering,
 * `activeIndex` and keyboard navigation all live in
 * `useModelPickerState`, so cmdk's own search and roving focus would
 * duplicate and fight them.
 */
export const PickerSearchInput: React.FC<PickerSearchInputProps> = ({
  value,
  onChange,
  onKeyDown,
  placeholder = 'Search models',
  'aria-label': ariaLabel,
  activeDescendantId,
  inputRef,
  listboxId,
  dense,
  leading,
  trailing,
  className,
  'data-testid': dataTestId,
}) => (
  <div
    className={cn(
      'flex items-center gap-2 border-b border-border bg-popover',
      dense ? 'p-2.5' : 'p-3',
      className
    )}
    data-slot="model-picker-toolbar"
  >
    {leading && <div className="flex shrink-0 items-center">{leading}</div>}
    <div
      className={cn(
        'flex min-w-0 flex-1 items-center gap-1.5 rounded-lg border border-border bg-popover px-2.5 transition-colors focus-within:border-ring',
        dense ? 'py-1' : 'py-1.5'
      )}
    >
      <Search
        aria-hidden
        className={cn('shrink-0 text-foreground-subtle', dense ? 'size-4' : 'size-[18px]')}
      />
      <input
        aria-activedescendant={activeDescendantId}
        aria-autocomplete="list"
        aria-controls={listboxId}
        aria-expanded
        aria-label={ariaLabel ?? placeholder}
        className={cn(
          'min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-foreground-subtle',
          dense ? 'text-xs' : 'text-sm'
        )}
        data-testid={dataTestId}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        ref={inputRef}
        role="combobox"
        value={value}
      />
    </div>
    {trailing && <div className="flex shrink-0 items-center">{trailing}</div>}
  </div>
);
