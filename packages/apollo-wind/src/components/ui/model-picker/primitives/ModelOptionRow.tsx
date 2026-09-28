'use client';

import { Pencil, Trash2 } from 'lucide-react';
import * as React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib';
import { DEFAULT_MODEL_PICKER_LABELS, type ModelPickerLabels } from '../labels';
import { ModelTagChip } from '../ModelTagChip';
import type { DiscoveryModel } from '../types';
import { type DeriveModelTagsContext, deriveModelTags, isByoModel } from '../utils';

export interface ModelOptionRowProps {
  model: DiscoveryModel;
  /**
   * Position of this row in the flat option list. Passed back through
   * `onActivate` so the row's handlers stay referentially stable — the
   * key to `React.memo` skipping re-renders of untouched rows.
   */
  index: number;
  active: boolean;
  selected: boolean;
  /**
   * Called with the row's model on click. Pass a stable reference
   * (e.g. the `choose` callback from `useModelPickerState`) so
   * memoization holds.
   */
  onSelect: (model: DiscoveryModel) => void;
  /**
   * Called with the row's index on pointer-enter (drives the keyboard
   * active-row highlight). Pass a stable reference.
   */
  onActivate?: (index: number) => void;
  /**
   * Context forwarded to `deriveModelTags`. Carries `homeRegion`,
   * `recommendedModelIds` / `previewModelIds` (Model Hub overrides),
   * `badgesFor`, `customTagsFor`, and `labels`.
   */
  tagContext?: DeriveModelTagsContext;
  /**
   * Variant lookup for tag kinds the design system doesn't know about.
   * Forwarded straight to `<ModelTagChip>`. Built-in kinds keep their
   * default variant unless explicitly overridden here.
   */
  tagVariants?: Record<string, string>;
  /**
   * Right-aligned actions renderer, called with the row's model.
   * Return `null` to suppress actions for a given row. When omitted,
   * no actions render (the standalone `defaultRowActions` needs an
   * `onEdit` handler the row cannot invent).
   */
  renderActions?: (model: DiscoveryModel) => React.ReactNode;
  /**
   * Extra meta renderer (below the context line in the right column).
   * Use for cost bars, latency badges, etc.
   */
  renderMeta?: (model: DiscoveryModel) => React.ReactNode;
  /**
   * Reduces row height + font sizes for tight surfaces (chat input
   * footers, narrow side panels). The stock picker doesn't use this;
   * kept for teams composing their own pickers from primitives.
   */
  dense?: boolean;
  /**
   * Tag kinds to hide from chip rendering. Tags are still derived; this
   * only affects display.
   */
  hideTagKinds?: readonly string[];
  /**
   * Stable DOM id assigned to the row. Used by the search input's
   * `aria-activedescendant` so screen readers announce the highlighted
   * row while keyboard focus stays on the input.
   */
  id?: string;
  'data-testid'?: string;
}

const FULL_OPTION_HEIGHT = 64;
const DENSE_OPTION_HEIGHT = 44;

/**
 * One row in the picker dropdown. Exported so teams can render their own
 * grouped/ungrouped lists while keeping the styling consistent with the
 * stock `<ModelPicker>`.
 *
 * Memoized: with stable `onSelect` / `onActivate` / renderer props, only
 * the rows whose `active` / `selected` flags actually changed re-render
 * when the user moves the highlight — the difference between smooth and
 * janky on 200+ model catalogs.
 */
const ModelOptionRowInner: React.FC<ModelOptionRowProps> = ({
  model,
  index,
  active,
  selected,
  onSelect,
  onActivate,
  tagContext,
  tagVariants,
  renderActions,
  renderMeta,
  dense,
  hideTagKinds,
  id,
  'data-testid': dataTestId,
}) => {
  const labels = tagContext?.labels ?? DEFAULT_MODEL_PICKER_LABELS;
  const inlineTags = deriveModelTags(model, tagContext ?? {}).filter(
    (t) => !hideTagKinds?.includes(t.kind)
  );

  // Friendly-mode rows show the human label up top and the technical id
  // as a monospace secondary line. Display names come from the
  // Discovery DTO only (authored centrally, merged server-side) —
  // products cannot rename models. When the DTO carries no name, the
  // technical name *is* the primary label and the secondary line only
  // renders for BYO models (where the connection name is the only
  // disambiguator between two models with the same technical id).
  const primaryLabel = model.displayName ?? null;
  const primary = primaryLabel ?? model.modelName;
  const usesFriendlyName = !!primaryLabel && primaryLabel !== model.modelId;
  const techId = usesFriendlyName ? model.modelId : null;
  // Through `labels`, not a local formatter: the column is user-facing copy
  // ("128K context"), so a host that translates everything else must be able
  // to translate this too.
  const contextTokens = model.modelDetails?.contextWindowTokens;
  const contextLabel =
    contextTokens != null && contextTokens > 0 ? labels.contextWindow(contextTokens) : null;
  const rowActions = renderActions ? renderActions(model) : null;
  const meta = renderMeta?.(model);

  return (
    // A `<button>` cannot contain the row's nested action buttons, and the
    // row never holds focus: keyboard selection is driven from the search
    // input through `aria-activedescendant`, so a key handler here would
    // never fire.
    // biome-ignore lint/a11y/useKeyWithClickEvents: the listbox owner handles keys; this row never has focus.
    <div
      aria-selected={selected}
      className={cn(
        // `@container` lets the row drop its lowest-priority column (the
        // context-window size) in narrow hosts — e.g. a product sidebar —
        // where it would otherwise crowd or overlap the model name.
        '@container relative flex w-full cursor-pointer items-start justify-start text-left',
        dense ? 'min-h-11 gap-2 px-3 py-1.5' : 'min-h-16 gap-3 px-3.5 py-2.5',
        // Selected: a 3px left accent bar plus a filled row. Active (the
        // keyboard highlight) and hover share the lighter treatment.
        selected
          ? 'bg-surface-selected shadow-[inset_3px_0_0_var(--brand)]'
          : active
            ? 'bg-surface-hover'
            : 'bg-transparent',
        !selected && 'hover:bg-surface-hover'
      )}
      data-slot="model-picker-row"
      data-testid={dataTestId}
      id={id}
      onClick={() => onSelect(model)}
      onMouseEnter={onActivate ? () => onActivate(index) : undefined}
      role="option"
      tabIndex={-1}
    >
      <div className="min-w-0 flex-1">
        {/* Chips sit next to the name, never wrapping to a second line:
            the title truncates first, then long chips ellipsize. */}
        <div className="flex min-w-0 flex-nowrap items-center gap-1.5">
          <span
            className={cn(
              'min-w-0 flex-[0_1_auto] truncate leading-snug font-semibold text-foreground',
              dense ? 'text-xs' : 'text-sm'
            )}
          >
            {primary}
          </span>
          {inlineTags.map((t) => (
            // `flex items-center` is load-bearing, not cosmetic: the chip is an
            // inline-flex Badge, so a block wrapper would generate a line box of
            // the inherited line-height (~21px) around a 16px chip and
            // baseline-align it, parking every chip ~3px above the title.
            //
            // `min-w-0 shrink overflow-hidden` lets a long chip (notably the
            // "Routes to …" substitution chip) ellipsize rather than overflow
            // into the context column.
            <span
              className="flex min-w-0 shrink items-center overflow-hidden [&_[data-slot=model-picker-tag]]:max-w-full [&_[data-slot=model-picker-tag]]:truncate"
              key={`${t.kind}-${t.label}`}
            >
              <ModelTagChip tag={t} variants={tagVariants} />
            </span>
          ))}
        </div>
        {techId && (
          // Friendly-mode secondary line: the canonical technical id in
          // monospace so users can still copy/audit the actual model
          // string the gateway will call.
          <span className="mt-0.5 block truncate font-mono text-[11px] text-foreground-muted">
            {techId}
          </span>
        )}
        {/*
          BYO rows surface the connection name regardless of friendly
          mode — two BYO models can share a technical id (`gpt-4o` from
          two different connections) and the connection label is the
          only disambiguator.
        */}
        {model.byoConnectionLabel && (
          <span
            className={cn(
              'block max-w-full truncate text-xs text-foreground-muted',
              !techId && 'mt-0.5'
            )}
          >
            {model.byoConnectionLabel}
          </span>
        )}
      </div>
      {(contextLabel ?? meta) && (
        // Right column: the context window line with any host-supplied
        // meta stacked underneath. Never shrinks — the name truncates
        // first — and hides entirely in a narrow row.
        // Stops a click on interactive meta from also selecting the row.
        // biome-ignore lint/a11y/noStaticElementInteractions: not a control, only a click sink.
        // biome-ignore lint/a11y/useKeyWithClickEvents: not a control, only a click sink.
        <div
          className="flex shrink-0 flex-col items-end gap-1 pt-px @max-[380px]:hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {contextLabel && (
            <span className="text-[11px] leading-tight text-foreground-muted">{contextLabel}</span>
          )}
          {meta}
        </div>
      )}
      {rowActions && (
        // Stops a click on a row action from also selecting the row.
        // biome-ignore lint/a11y/noStaticElementInteractions: not a control, only a click sink.
        // biome-ignore lint/a11y/useKeyWithClickEvents: not a control, only a click sink.
        <div
          className="flex shrink-0 items-center gap-0.5 pt-px text-foreground-muted"
          onClick={(e) => e.stopPropagation()}
        >
          {rowActions}
        </div>
      )}
    </div>
  );
};

export const ModelOptionRow = React.memo(ModelOptionRowInner);
ModelOptionRow.displayName = 'ModelOptionRow';

/**
 * Default row-actions renderer: edit (and optionally delete) icon
 * buttons for BYO models. Exported so consumers can fall back to it
 * when overriding row actions selectively (e.g. add a "Set default"
 * action without losing edit).
 *
 * Renders nothing without a handler — an action button that does
 * nothing is worse than no button. Admin-gated by default: the picker
 * only calls this when `canManageByo` is true. Standalone consumers
 * should gate the call themselves before passing the result into
 * `renderActions`.
 */
export function defaultRowActions(
  model: DiscoveryModel,
  options: {
    /** Strings for the action tooltips. Defaults to English. */
    labels?: ModelPickerLabels;
    /** Edit activation — the picker navigates to the configuration page. */
    onEdit?: (model: DiscoveryModel) => void;
    /**
     * Delete activation — optional. When provided, a delete icon renders
     * alongside edit on BYO rows.
     */
    onDelete?: (model: DiscoveryModel) => void;
  } = {}
): React.ReactNode {
  const { labels = DEFAULT_MODEL_PICKER_LABELS, onEdit, onDelete } = options;
  if (!onEdit && !onDelete) return null;
  // Same predicate grouping and tagging use, so a row filed under Custom
  // Models by its `byomDetails` alone still gets its actions.
  if (!isByoModel(model)) return null;
  const editTitle = labels.editConfiguration;
  const deleteTitle = labels.deleteConfiguration;
  return (
    // Own provider so `defaultRowActions` works standalone; Radix nests
    // providers harmlessly when the host already mounts one.
    <TooltipProvider>
      {onEdit && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              aria-label={editTitle}
              className="cursor-pointer rounded p-1 text-inherit hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              onClick={() => onEdit(model)}
              // Not a tab stop: an interactive child of `role="option"` breaks
              // the activedescendant model. Keyboard path is Shift+Enter.
              tabIndex={-1}
              type="button"
            >
              <Pencil className="size-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent>{editTitle}</TooltipContent>
        </Tooltip>
      )}
      {onDelete && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              aria-label={deleteTitle}
              className="cursor-pointer rounded p-1 text-inherit hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              onClick={() => onDelete(model)}
              // Keyboard path is Delete on an empty search.
              tabIndex={-1}
              type="button"
            >
              <Trash2 className="size-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent>{deleteTitle}</TooltipContent>
        </Tooltip>
      )}
    </TooltipProvider>
  );
}

export { DENSE_OPTION_HEIGHT, FULL_OPTION_HEIGHT };
