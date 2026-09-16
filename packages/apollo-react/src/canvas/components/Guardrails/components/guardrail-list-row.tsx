import {
  Badge,
  Button,
  cn,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@uipath/apollo-wind';
import { Pencil, Trash2 } from 'lucide-react';
import * as React from 'react';
import { getGuardrailListChips } from '../guardrail-list-utils';
import { formatGuardrailFormMessage, type GuardrailListLabels } from '../i18n';
import type {
  GuardrailListAdministration,
  GuardrailListItem,
  GuardrailListItemActionsContext,
  GuardrailListItemState,
  GuardrailRowTooltipRenderer,
} from '../list-types';
import { GuardrailStatusChip } from './guardrail-status-chip';

export interface GuardrailListRowProps
  extends Omit<React.ComponentPropsWithoutRef<'div'>, 'children'> {
  item: GuardrailListItem;
  /** The row's resolved id, and its index in the rendered list. */
  id: string;
  index: number;
  /** What resolving the row against the definitions produced. */
  state: GuardrailListItemState;
  labels: GuardrailListLabels;
  /** Read-only: edit and remove are disabled. Reorder is the list's decision, not the row's. */
  disabled?: boolean;
  /** Drag handle, already wired to the sortable. Absent when the list cannot be reordered. */
  handle?: React.ReactNode;
  administration?: GuardrailListAdministration;
  statusChips?: boolean;
  previewChip?: boolean;
  byoChip?: boolean;
  /** Makes the row body a button that opens the editor (Agents' behaviour). */
  rowActivatesEdit?: boolean;
  onEdit?: (item: GuardrailListItem) => void;
  onRemove?: (item: GuardrailListItem) => void;
  renderItemActions?: (ctx: GuardrailListItemActionsContext) => React.ReactNode;
  /** Hover and focus content for the row body. See `GuardrailRowTooltipRenderer`. */
  renderRowTooltip?: GuardrailRowTooltipRenderer;
  formatScopes?: (item: GuardrailListItem) => React.ReactNode;
  formatAction?: (item: GuardrailListItem) => React.ReactNode;
}

/**
 * One guardrail row: drag handle, name with its chips, BYO notices, description, provider
 * line, action badge and scopes, then the row actions.
 *
 * Presentational and reorder-free. The sortable wrapper in `guardrail-list.tsx` reaches it
 * through `ref`, `style` and `handle`, so it also mounts without a `DndContext`.
 */
const GuardrailListRow = React.forwardRef<HTMLDivElement, GuardrailListRowProps>(
  (
    {
      item,
      id,
      index,
      state,
      labels,
      disabled = false,
      handle,
      administration,
      statusChips = false,
      previewChip = false,
      byoChip = false,
      rowActivatesEdit = false,
      onEdit,
      onRemove,
      renderItemActions,
      renderRowTooltip,
      formatScopes,
      formatAction,
      className,
      ...props
    },
    ref
  ) => {
    const handleEdit = onEdit && !disabled ? () => onEdit(item) : undefined;
    const handleRemove = onRemove && !disabled ? () => onRemove(item) : undefined;

    const chips = statusChips
      ? getGuardrailListChips({ status: state.status, administration }, labels)
      : [];
    const isBuiltInValidator = item.$guardrailType === 'builtInValidator';

    // Every row ships the same two icon buttons, so an unnamed one leaves a screen-reader user
    // unable to tell which row they are on. The generic label stays for a row with no name.
    const rowName = item.name.trim();
    const nameRow = (template: string, generic: string) =>
      rowName ? formatGuardrailFormMessage(template, { name: rowName }) : generic;

    const scopes = item.selector?.scopes ?? [];
    // Presence of the prop decides, never the value: a host hides the line by returning null
    // (Agents renders scopes in its own tooltip instead), which `??` would swallow.
    const scopesContent = formatScopes ? formatScopes(item) : scopes.join(', ') || null;
    const actionContent = formatAction
      ? formatAction(item)
      : (item.action?.$actionType ?? labels.actionUnknown);

    const defaultActions = (
      <>
        {onEdit && (
          <Button
            type="button"
            variant="ghost"
            size="3xs"
            icon
            disabled={disabled}
            aria-label={nameRow(labels.editRow, labels.editItem)}
            onClick={handleEdit}
          >
            <Pencil />
          </Button>
        )}
        {onRemove && (
          <Button
            type="button"
            variant="ghost"
            size="3xs"
            icon
            disabled={disabled}
            aria-label={nameRow(labels.removeRow, labels.removeItem)}
            // Ghost restates its foreground under `future:` and on hover, so the destructive
            // tint has to win in all four scopes or the button greys out under the pointer.
            className="text-destructive future:text-destructive hover:text-destructive future:hover:text-destructive"
            onClick={handleRemove}
          >
            <Trash2 />
          </Button>
        )}
      </>
    );

    const actions = renderItemActions
      ? renderItemActions({
          item,
          id,
          index,
          disabled,
          onEdit: handleEdit,
          onRemove: handleRemove,
          defaultActions,
        })
      : defaultActions;

    const tooltip = renderRowTooltip?.(item);
    const activatable = rowActivatesEdit && handleEdit !== undefined;

    // ARIA treats the children of a `role="button"` as presentational, so an activatable row
    // is announced as its label alone. `aria-describedby` puts back only what changes what
    // activating it does: the status and administration chips, the BYO notices and the
    // description. `Preview`, the provider, the action and the scopes stay presentational,
    // being repeated metadata; naming them all turns one announcement into a paragraph. The
    // README's `rowActivatesEdit` row says so, for a host that needs them outside the body.
    const bodyId = React.useId();
    const chipId = (chip: string) => `${bodyId}-chip-${chip}`;
    const byoDisabledId = `${bodyId}-byo-disabled`;
    const byoUnavailableId = `${bodyId}-byo-unavailable`;
    const descriptionId = `${bodyId}-description`;
    const describedBy = activatable
      ? [
          ...chips.map((chip) => chipId(chip.id)),
          state.byoDisabled ? byoDisabledId : undefined,
          state.byoUnavailable ? byoUnavailableId : undefined,
          item.description ? descriptionId : undefined,
        ]
          .filter(Boolean)
          .join(' ')
      : '';

    // Only the body carries the role: the handle and the actions are siblings, so an
    // activatable row never nests interactive controls inside a button.
    const bodyProps: React.HTMLAttributes<HTMLDivElement> = activatable
      ? {
          role: 'button',
          tabIndex: 0,
          'aria-label': nameRow(labels.editRow, labels.editItem),
          ...(describedBy ? { 'aria-describedby': describedBy } : {}),
          onClick: handleEdit,
          onKeyDown: (event: React.KeyboardEvent) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              handleEdit?.();
            }
          },
        }
      : // Not activatable, but tooltipped: Radix opens on focus as well as hover, so the body
        // has to be focusable or the tooltip content is pointer-only (WCAG 1.4.13).
        tooltip
        ? { tabIndex: 0 }
        : {};

    const body = (
      <div
        className={cn(
          'min-w-0 flex-1',
          // An element that is itself a control carries the cursor and its own focus ring, where
          // the row around it only highlights. Without this the body falls back to the UA outline.
          activatable &&
            'cursor-pointer rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
        )}
        {...bodyProps}
      >
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{item.name}</span>
          {byoChip && state.isByo && (
            // Green, the colour both products already give this chip, and ahead of `preview`
            // because a BYO row is also a built-in validator: provenance first, then lifecycle.
            <GuardrailStatusChip tone="success">{labels.byo}</GuardrailStatusChip>
          )}
          {previewChip && isBuiltInValidator && (
            // Blue, the colour both products already give this chip.
            <GuardrailStatusChip tone="info">{labels.preview}</GuardrailStatusChip>
          )}
          {chips.map((chip) => (
            <GuardrailStatusChip key={chip.id} id={chipId(chip.id)} tone={chip.tone}>
              {chip.label}
            </GuardrailStatusChip>
          ))}
        </div>
        {/* Ungated: a guardrail that cannot run is not an opt-in detail, and both products
              already show these. `text-error` not `text-destructive`, which resolve differently
              in several `tailwind.consumer.css` blocks; `role="alert"` for parity with Flow,
              which announces them on mount. */}
        {state.byoDisabled && (
          <div
            id={byoDisabledId}
            className="whitespace-normal break-words text-xs text-error"
            role="alert"
          >
            {labels.byoDisabledNotice}
          </div>
        )}
        {state.byoUnavailable && (
          <div
            id={byoUnavailableId}
            className="whitespace-normal break-words text-xs text-error"
            role="alert"
          >
            {labels.byoUnavailableNotice}
          </div>
        )}
        {item.description && (
          <div id={descriptionId} className="truncate text-xs text-muted-foreground">
            {item.description}
          </div>
        )}
        {state.provider !== undefined && (
          <div className="truncate text-xs text-muted-foreground">
            {labels.provider}: {state.provider}
          </div>
        )}
        {(actionContent || scopesContent) && (
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {actionContent && (
              <Badge
                variant="secondary"
                className={cn(
                  'border-border bg-muted/60 text-xs text-muted-foreground',
                  // Only the raw `$actionType` needs casing help. Host-localized output is
                  // already cased for its locale, and `capitalize` would mangle it.
                  !formatAction && 'capitalize'
                )}
              >
                {actionContent}
              </Badge>
            )}
            {scopesContent && (
              <span className="text-xs text-muted-foreground">{scopesContent}</span>
            )}
          </div>
        )}
      </div>
    );

    return (
      <div
        ref={ref}
        data-slot="guardrail-list-row"
        data-guardrail-id={id}
        className={cn(
          'flex items-center gap-2',
          // The whole row tints, not just the body, and ungated: a row is a hover target
          // whether or not clicking it opens the editor, and it is what you aim the handle and
          // the actions at. The negative margin pairs with the horizontal padding so the tint
          // extends past the content without moving it, while vertically the padding stands
          // alone so the 8px between rows still separates two tinted boxes. `accent` is
          // Apollo's hover surface; `muted` is `surface-overlay`, the panel the list sits on.
          '-mx-1 rounded-md p-1 transition-colors hover:bg-accent',
          className
        )}
        {...props}
      >
        {handle}
        {tooltip ? (
          // Own provider: wind's `Tooltip` throws outside one, and a row renders where none is
          // guaranteed. Nesting inside an existing provider only rescopes the delays.
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>{body}</TooltipTrigger>
              <TooltipContent>{tooltip}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          body
        )}
        <div data-slot="guardrail-list-row-actions" className="flex shrink-0 items-center gap-0">
          {actions}
        </div>
      </div>
    );
  }
);
GuardrailListRow.displayName = 'GuardrailListRow';

export { GuardrailListRow };
