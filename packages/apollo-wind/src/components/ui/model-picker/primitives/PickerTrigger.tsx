'use client';

import { ChevronDown } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib';
import { DEFAULT_MODEL_PICKER_LABELS } from '../labels';
import { ModelTagChip } from '../ModelTagChip';
import type { DiscoveryModel } from '../types';
import { type DeriveModelTagsContext, deriveModelTags } from '../utils';

export interface PickerTriggerProps
  extends Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    'id' | 'className' | 'disabled' | 'onClick' | 'placeholder'
  > {
  id: string;
  selected: DiscoveryModel | null;
  /**
   * Raw stored value that didn't resolve against `models`. When set,
   * the trigger renders the id verbatim in error red with the border
   * switched to error red — so a stale config doesn't look identical
   * to "nothing selected". `null` for the normal case.
   */
  unknownValue?: string | null;
  /**
   * Stored value whose model has not resolved *yet* because the catalog is
   * still loading. Rendered as plain text — unlike `unknownValue`, this is
   * not an error state, and showing the placeholder instead would read as
   * "your saved model is gone" every time a form opens.
   */
  pendingValue?: string | null;
  placeholder?: string;
  disabled?: boolean;
  open: boolean;
  invalid?: boolean;
  /**
   * Context forwarded to `deriveModelTags` for the selected model's
   * chips. Carries the translator, `homeRegion`, test overrides, and
   * `customTagsFor`.
   */
  tagContext?: DeriveModelTagsContext;
  /**
   * Variant lookup for tag kinds the design system doesn't know about.
   * Forwarded straight to `<ModelTagChip>`.
   */
  tagVariants?: Record<string, string>;
  /** Extra content rendered to the right of the model name, before the caret. */
  extra?: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  /**
   * Tag kinds to hide from the trigger's selected-model chips. Used by
   * the compact picker to keep the trigger uncluttered.
   */
  hideTagKinds?: readonly string[];
  /**
   * ID of the popup's listbox, for `aria-controls`, so screen readers
   * know which element the trigger opens.
   */
  controlsId?: string;
  /**
   * ID of an external error message. Forwarded as `aria-describedby`
   * so screen readers announce the error alongside the field.
   */
  describedById?: string;
  /**
   * Whether the field is required. Not forwarded as `aria-required` —
   * that attribute is invalid on `role="button"`, and the requirement is
   * already announced by the label's `RequiredIndicator`. Accepted so a
   * standalone consumer can style the trigger accordingly.
   */
  required?: boolean;
  className?: string;
  'data-testid'?: string;
}

/**
 * The picker's field control. A plain `<button>` rather than the shared
 * `Button` so it can carry the two-line/chips content and the invalid
 * state without fighting `Button`'s own size and gap variants; the
 * resting chrome deliberately matches wind's `outline` field styling so
 * the picker sits consistently alongside other form controls.
 *
 * Designed to be used as a Radix `<PopoverTrigger asChild>` child, so
 * it forwards its ref and spreads no props it doesn't own.
 */
export const PickerTrigger = React.forwardRef<HTMLButtonElement, PickerTriggerProps>(
  function PickerTrigger(
    {
      id,
      selected,
      unknownValue,
      pendingValue,
      placeholder = 'Select a model',
      disabled,
      open,
      invalid,
      tagContext,
      tagVariants,
      extra,
      onClick,
      hideTagKinds,
      controlsId,
      describedById,
      required,
      className,
      'data-testid': dataTestId,
      ...rest
    },
    ref
  ) {
    const labels = tagContext?.labels ?? DEFAULT_MODEL_PICKER_LABELS;
    const effectiveCtx: DeriveModelTagsContext = tagContext ?? { labels };
    const inlineTags = selected
      ? deriveModelTags(selected, effectiveCtx).filter((t) => !hideTagKinds?.includes(t.kind))
      : [];
    // Display names come from the Discovery DTO only — same resolution
    // as the rows, so trigger and popup always agree.
    const primary = selected ? (selected.displayName ?? selected.modelName) : null;

    // Radix injects `onClick`, `aria-haspopup="dialog"` and friends through
    // `asChild`. Spread those first so our listbox semantics win, but keep
    // Radix's click handler when this trigger has none of its own.
    const ownClick = onClick ? { onClick } : {};

    return (
      <button
        {...rest}
        {...ownClick}
        aria-controls={open && controlsId ? controlsId : undefined}
        aria-describedby={describedById}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-invalid={invalid ? true : undefined}
        className={cn(
          // Lifted verbatim from `Input` (default variant, default size) so the
          // picker reads as a field rather than a button, and so the two cannot
          // drift apart. `min-h-9` rather than `h-9`: identical at rest, but a
          // tall `slots.triggerExtra` grows the row instead of being clipped.
          'flex min-h-9 w-full cursor-pointer items-center justify-start gap-3 rounded-md border border-input bg-transparent px-3 py-1 text-left text-sm text-foreground transition-colors',
          'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
          'disabled:cursor-not-allowed disabled:opacity-50',
          // Attribute-driven, like `Input` — the trigger already sets aria-invalid.
          'aria-invalid:border-error aria-invalid:focus-visible:ring-error',
          'future:h-10 future:rounded-xl future:border-0 future:bg-surface-overlay future:py-2 future:text-sm future:focus-visible:ring-offset-2 future:focus-visible:ring-offset-background future:aria-invalid:ring-1 future:aria-invalid:ring-error/40',
          className
        )}
        data-slot="model-picker-trigger"
        data-testid={dataTestId}
        disabled={disabled}
        id={id}
        ref={ref}
        type="button"
      >
        <span className="flex min-w-0 flex-1 flex-nowrap items-center gap-1.5">
          {selected ? (
            <>
              <span className="max-w-full truncate text-foreground">{primary}</span>
              {inlineTags.map((t) => (
                // `flex items-center` for the same reason as the option rows:
                // a block wrapper baseline-aligns the inline-flex chip inside
                // an inherited line box and lifts it off the title's centre.
                <span className="flex shrink-0 items-center" key={`${t.kind}-${t.label}`}>
                  <ModelTagChip disableTooltip tag={t} variants={tagVariants} />
                </span>
              ))}
            </>
          ) : pendingValue ? (
            <span className="max-w-full truncate text-foreground">{pendingValue}</span>
          ) : unknownValue ? (
            <span
              className="max-w-full truncate text-error"
              title={labels.unknownValueTooltip(unknownValue)}
            >
              {unknownValue}
            </span>
          ) : (
            <span className="text-foreground-subtle">{placeholder}</span>
          )}
        </span>
        {extra && (
          // biome-ignore lint/a11y/noStaticElementInteractions: not a control, only a click sink.
          // biome-ignore lint/a11y/useKeyWithClickEvents: stops a click on `extra` from also opening the popup.
          <span className="flex shrink-0 items-center" onClick={(e) => e.stopPropagation()}>
            {extra}
          </span>
        )}
        <ChevronDown
          aria-hidden
          className={cn(
            'size-[18px] shrink-0 text-foreground-muted transition-transform duration-150',
            open && 'rotate-180'
          )}
        />
      </button>
    );
  }
);
