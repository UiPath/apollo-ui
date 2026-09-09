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
  /** Makes the row body a button that opens the editor (Agents' behaviour). */
  rowActivatesEdit?: boolean;
  onEdit?: (item: GuardrailListItem) => void;
  onRemove?: (item: GuardrailListItem) => void;
  renderItemActions?: (ctx: GuardrailListItemActionsContext) => React.ReactNode;
  /** Hover content for the row body. Return nothing to leave the row untooltipped. */
  renderRowTooltip?: (item: GuardrailListItem) => React.ReactNode;
  formatScopes?: (item: GuardrailListItem) => React.ReactNode;
  formatAction?: (item: GuardrailListItem) => React.ReactNode;
}

/**
 * One guardrail row: drag handle, name with its lifecycle and status chips, BYO notices,
 * description, provider line, action badge and scopes, then the row actions.
 *
 * Presentational and reorder-free. The sortable wrapper lives in `guardrail-list.tsx` and
 * reaches the row through `ref`, `style` and `handle`, so this renders identically whether or
 * not the list is reorderable, and the a11y suites can mount it without a `DndContext`.
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
            aria-label={labels.editItem}
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
            aria-label={labels.removeItem}
            // Ghost restates its foreground under `future:` and again on hover, so the
            // destructive tint has to win in all four scopes or the button greys out the
            // moment the pointer lands on it.
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

    // Only the body carries the role: the handle and the actions are siblings, so an
    // activatable row never nests interactive controls inside a button.
    const bodyProps =
      rowActivatesEdit && handleEdit
        ? {
            role: 'button',
            tabIndex: 0,
            'aria-label': formatGuardrailFormMessage(labels.editRow, { name: item.name }),
            onClick: handleEdit,
            onKeyDown: (event: React.KeyboardEvent) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                handleEdit();
              }
            },
          }
        : {};

    const body = (
      <div
        className={cn('min-w-0 flex-1', rowActivatesEdit && handleEdit && 'cursor-pointer')}
        {...bodyProps}
      >
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{item.name}</span>
          {previewChip && isBuiltInValidator && (
            <GuardrailStatusChip tone="neutral">{labels.preview}</GuardrailStatusChip>
          )}
          {chips.map((chip) => (
            <GuardrailStatusChip key={chip.id} tone={chip.tone}>
              {chip.label}
            </GuardrailStatusChip>
          ))}
        </div>
        {/* Both notices are ungated: both products already show them, and a guardrail that
              cannot run is not an opt-in detail. */}
        {state.byoDisabled && (
          <div className="whitespace-normal break-words text-xs text-destructive" role="alert">
            {labels.byoDisabledNotice}
          </div>
        )}
        {state.byoUnavailable && (
          <div className="whitespace-normal break-words text-xs text-destructive" role="alert">
            {labels.byoUnavailableNotice}
          </div>
        )}
        {item.description && (
          <div className="truncate text-xs text-muted-foreground">{item.description}</div>
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
                className="border-border bg-muted/60 text-[11px] capitalize text-muted-foreground"
              >
                {actionContent}
              </Badge>
            )}
            {scopesContent && (
              <span className="text-[11px] text-muted-foreground">{scopesContent}</span>
            )}
          </div>
        )}
      </div>
    );

    const tooltip = renderRowTooltip?.(item);

    return (
      <div
        ref={ref}
        data-slot="guardrail-list-row"
        data-guardrail-id={id}
        className={cn('flex items-center gap-2', className)}
        {...props}
      >
        {handle}
        {tooltip ? (
          // Own provider: wind's `Tooltip` is a bare Radix root and throws outside one, and a
          // row renders where none is guaranteed. Nesting inside an existing provider only
          // rescopes the delays.
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>{body}</TooltipTrigger>
              <TooltipContent>{tooltip}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          body
        )}
        <div className="flex shrink-0 items-center gap-0">{actions}</div>
      </div>
    );
  }
);
GuardrailListRow.displayName = 'GuardrailListRow';

export { GuardrailListRow };
