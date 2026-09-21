'use client';

import { ChevronRight } from 'lucide-react';
import type * as React from 'react';
import { cn } from '@/lib';

export interface GroupHeaderProps {
  label: string;
  /**
   * Descriptive hint about the group. Surfaced as a `title` tooltip on
   * the header — inline hints added more chrome than information.
   */
  hint?: string;
  /**
   * Right-aligned model count (e.g. "3 models"). Pass when known; the
   * header pluralizes automatically. Omit to suppress.
   */
  count?: number;
  /**
   * Pre-localized "{n} models" / "{n} model" label rendered to the
   * right of the title. When provided, overrides the built-in
   * (English-only) ternary derived from `count`.
   */
  countLabel?: string;
  /** Reduces vertical padding for the compact picker. */
  dense?: boolean;
  /**
   * Whether this is the first header in the list. When true, no
   * `border-top` is drawn — that line would double up with the search
   * row's existing `border-bottom`.
   */
  isFirst?: boolean;
  /**
   * Leading icon glyph rendered before the label. Used for the BYO
   * accordion's shield icon. Falls back to nothing when omitted.
   */
  leadingIcon?: React.ReactNode;
  /**
   * When `true`, the header renders as a button with a trailing
   * chevron (rotated based on `collapsed`) and calls `onToggle` on
   * click. Used for the BYO accordion at the bottom of the list.
   */
  collapsible?: boolean;
  /** Current collapsed state (rotates chevron) when `collapsible`. */
  collapsed?: boolean;
  /** Click handler; required when `collapsible`. */
  onToggle?: () => void;
  /** Optional test id forwarded to the header. */
  'data-testid'?: string;
}

/**
 * Section header rendered between model groups in the picker dropdown.
 * Exported so teams can render their own grouped layouts.
 *
 * Two modes:
 *   - **Static** (default): a label band with optional leading icon +
 *     trailing count. No interactivity. Used for Recommended / Preview
 *     / More / Deprecating / per-vendor sections.
 *   - **Collapsible**: same chrome, but the entire band is a button
 *     with a trailing chevron that flips on `collapsed`. Used by the
 *     BYO accordion at the bottom of the Category view.
 */
export const GroupHeader: React.FC<GroupHeaderProps> = ({
  label,
  hint,
  count,
  countLabel,
  dense,
  isFirst,
  leadingIcon,
  collapsible,
  collapsed,
  onToggle,
  'data-testid': dataTestId,
}) => {
  const resolvedCountLabel =
    countLabel ?? (count != null ? `${count} ${count === 1 ? 'model' : 'models'}` : null);

  const base = cn(
    'flex w-full items-center gap-2 bg-surface-raised text-left',
    dense ? 'px-3 pb-1' : 'px-3.5 pb-1.5',
    isFirst
      ? dense
        ? 'pt-1.5'
        : 'pt-3'
      : dense
        ? 'pt-2.5 border-t border-border'
        : 'pt-3.5 border-t border-border'
  );

  const content = (
    <>
      {leadingIcon && (
        <span aria-hidden className="flex items-center text-foreground-muted">
          {leadingIcon}
        </span>
      )}
      <span
        className={cn(
          'flex-auto font-bold tracking-wide text-foreground-muted uppercase',
          dense ? 'text-[9px] leading-[1.2]' : 'text-[11px] leading-[1.2]'
        )}
      >
        {label}
      </span>
      {resolvedCountLabel != null && (
        <span
          className={cn(
            'shrink-0 font-normal text-foreground-subtle',
            dense ? 'text-[10px]' : 'text-[11px]'
          )}
        >
          {resolvedCountLabel}
        </span>
      )}
      {collapsible && (
        <ChevronRight
          aria-hidden
          className={cn(
            'size-4 shrink-0 text-foreground-muted transition-transform duration-150',
            collapsed ? 'rotate-0' : 'rotate-90'
          )}
        />
      )}
    </>
  );

  if (collapsible) {
    return (
      <button
        aria-expanded={!collapsed}
        className={cn(
          base,
          'cursor-pointer hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none'
        )}
        data-slot="model-picker-group-header"
        data-testid={dataTestId}
        onClick={onToggle}
        title={hint}
        type="button"
      >
        {content}
      </button>
    );
  }
  return (
    <div
      className={base}
      data-slot="model-picker-group-header"
      data-testid={dataTestId}
      role="presentation"
      title={hint}
    >
      {content}
    </div>
  );
};
