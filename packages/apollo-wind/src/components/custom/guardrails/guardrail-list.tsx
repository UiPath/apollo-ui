import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus, Shield } from 'lucide-react';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib';
import { GuardrailListRow } from './components/guardrail-list-row';
import { GuardrailStatusBanner } from './components/guardrail-status-banner';
import { MixedScopesBanner } from './components/mixed-scopes-banner';
import {
  defaultGuardrailItemId,
  type GuardrailListDefinition,
  moveGuardrail,
  resolveGuardrailListItemState,
} from './guardrail-list-utils';
import { type GuardrailListLabels, resolveGuardrailListLabels } from './i18n';
import type {
  GuardrailListItem,
  GuardrailListItemActionsContext,
  GuardrailListMove,
  GuardrailListOrigin,
} from './list-types';
import { type GuardrailMessages, loadGuardrailMessages } from './load-messages';

const DND_MODIFIERS = [restrictToVerticalAxis, restrictToParentElement];
// A small activation distance keeps a click on the handle from starting a drag, which is what
// makes the handle usable as a button (and keyboard-focusable) at the same time.
const POINTER_SENSOR_OPTIONS = { activationConstraint: { distance: 8 } };

export interface GuardrailListProps<T extends GuardrailListItem = GuardrailListItem> {
  /**
   * The rows to render, in order.
   *
   * Pre-filtered by the host: this component never drops a row. Every product-side gate lives
   * on the other side of the boundary, including Agents' six `enableGuardrail*` feature flags
   * and Flow's `canvas.guardrails` entitlement plus its allowed-scope filter. Pass the
   * survivors.
   */
  guardrails: T[];
  /**
   * Definitions catalog used to resolve each row's status, provider and notices. Also
   * host-filtered. Omit it for lists that hold only custom guardrails.
   */
  definitions?: readonly GuardrailListDefinition[];
  /** Read-only mode: no reordering, actions rendered disabled. */
  disabled?: boolean;
  /**
   * Whether reordering is off, independent of `disabled`. Defaults to `disabled`, which is
   * what Agents does. Flow's read-only list stays reorderable, so it passes `false`.
   */
  reorderDisabled?: boolean;
  /**
   * Called with the reordered visible array and the move that produced it. Hosts rendering a
   * filtered view (Flow's tool view over an agent-level list) use `move` to splice the change
   * back into the full list. Omit to render no drag handles.
   */
  onReorder?: (guardrails: T[], move: GuardrailListMove) => void;
  /** Edit intent. The host owns the builder; omit to render no edit affordance. */
  onEdit?: (guardrail: T) => void;
  /**
   * Remove intent, not the removal. Both products confirm first, with different copy and
   * different scoped-removal rules, so the dialog and the mutation stay host-side.
   */
  onRemove?: (guardrail: T) => void;
  /** Add intent. Omit (or replace with `addSlot`) to render no add affordance. */
  onAdd?: () => void;
  /** Pre-localized scope and tool names this guardrail also applies to; null hides the banner. */
  mixedScopes?: { scopes: string[]; tools: string[] } | null;
  /** Section-level notice, e.g. a definitions load failure. */
  statusBanner?: { tone: 'error' | 'warning'; message: string } | null;
  /** Row identity. Defaults to `id`, falling back to `name` for hosts that persist no id. */
  getItemId?: (guardrail: T) => string;
  /** Where a row is administered from. Defaults to `'local'` for every row. */
  getItemOrigin?: (guardrail: T) => GuardrailListOrigin;
  /** Replace a row's Edit/Delete buttons wholesale, e.g. with an overflow menu. */
  renderItemActions?: (context: GuardrailListItemActionsContext<T>) => ReactNode;
  /** Replace the header's Add button, e.g. with an entitlement lock. */
  addSlot?: ReactNode;
  /**
   * Rendered below the rows. Agents puts its add affordance here rather than in the header,
   * and swaps it for an entitlement line, so `addSlot` alone cannot express that layout.
   */
  footer?: ReactNode;
  /**
   * Show the status and origin chips. Off by default: neither product renders them today, so
   * an adopting host gets a behaviour-identical swap and turns them on deliberately. The two
   * BYO row notices are not gated by this, because both products already show those.
   */
  statusChips?: boolean;
  /**
   * Mark built-in-validator rows as preview. Off by default: whether the feature is in
   * preview is product lifecycle, and baking it in would need a package release to undo.
   */
  previewChip?: boolean;
  /**
   * Drop the card chrome (border, rounding, content padding) for hosts that supply their own
   * container, e.g. Agents' `SectionAccordion`.
   */
  unstyled?: boolean;
  /** Let the row body activate edit on click and Enter/Space, in addition to any Edit button. */
  rowActivatesEdit?: boolean;
  hideHeader?: boolean;
  /** Overrides the header title text. */
  title?: ReactNode;
  /** Replaces the default "No guardrails configured" line. */
  emptyState?: ReactNode;
  /** Renders the row's scope summary. Defaults to the raw scopes, comma-joined. */
  formatScopes?: (guardrail: T) => string | undefined;
  /** Renders the row's action badge. Defaults to the raw `$actionType`. */
  formatAction?: (guardrail: T) => ReactNode;
  /**
   * Tooltip content for a row, e.g. Agents' combined description, provider and scopes hover.
   * Return nothing to leave a row untooltipped. Requires an ancestor `TooltipProvider`, and
   * only when the slot is supplied.
   */
  renderRowTooltip?: (guardrail: T) => ReactNode;
  /** Host locale; loads the packaged catalog. Omit for synchronous English. */
  locale?: string;
  labels?: Partial<GuardrailListLabels>;
  className?: string;
}

/** Resolve chrome strings: English defaults < packaged catalog < `labels` overrides. */
function useGuardrailListLabels(
  locale?: string,
  overrides?: Partial<GuardrailListLabels>
): GuardrailListLabels {
  const [catalog, setCatalog] = useState<GuardrailMessages>({});

  useEffect(() => {
    if (!locale) {
      setCatalog({});
      return;
    }
    let cancelled = false;
    loadGuardrailMessages(locale).then((messages) => {
      if (!cancelled) setCatalog(messages);
    });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  return useMemo(() => resolveGuardrailListLabels(catalog, overrides), [catalog, overrides]);
}

function defaultFormatScopes(guardrail: GuardrailListItem): string | undefined {
  const scopes = guardrail.selector?.scopes;
  return scopes && scopes.length > 0 ? scopes.join(', ') : undefined;
}

function defaultFormatAction(guardrail: GuardrailListItem): ReactNode {
  return guardrail.action?.$actionType;
}

/**
 * The guardrails list section: the guardrails applied to an agent or tool, with reorder,
 * status and origin chips, per-row edit/remove intents, and the mixed-scopes banner.
 *
 * Rendering only. The host filters the rows, owns the add/edit flows and the remove
 * confirmation, and fires its own telemetry around the callbacks. Feature flags never cross
 * this boundary.
 */
export function GuardrailList<T extends GuardrailListItem = GuardrailListItem>({
  guardrails,
  definitions,
  disabled = false,
  reorderDisabled = disabled,
  onReorder,
  onEdit,
  onRemove,
  onAdd,
  mixedScopes = null,
  statusBanner = null,
  getItemId = defaultGuardrailItemId,
  getItemOrigin,
  renderItemActions,
  addSlot,
  footer,
  statusChips = false,
  previewChip = false,
  unstyled = false,
  rowActivatesEdit = false,
  hideHeader = false,
  title,
  emptyState,
  formatScopes = defaultFormatScopes,
  formatAction = defaultFormatAction,
  renderRowTooltip,
  locale,
  labels: labelOverrides,
  className,
}: GuardrailListProps<T>) {
  const labels = useGuardrailListLabels(locale, labelOverrides);

  const sensors = useSensors(
    useSensor(PointerSensor, POINTER_SENSOR_OPTIONS),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const sortableIds = useMemo(() => guardrails.map(getItemId), [guardrails, getItemId]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || !onReorder) return;
    const result = moveGuardrail(guardrails, String(active.id), String(over.id), getItemId);
    if (result) onReorder(result.guardrails, result.move);
  };

  const sortable = onReorder !== undefined && !reorderDisabled;

  const header = hideHeader ? null : (
    <div className="flex items-center justify-between px-3 py-2">
      <div className="flex items-center gap-2">
        <Shield className="size-4 text-foreground-muted" aria-hidden="true" />
        <span className="text-sm font-medium">{title ?? labels.headerTitle}</span>
      </div>
      {addSlot ??
        (onAdd && (
          <Button variant="ghost" size="2xs" disabled={disabled} onClick={onAdd}>
            <Plus />
            {labels.addButton}
          </Button>
        ))}
    </div>
  );

  return (
    <div data-slot="guardrail-list" className={cn(!unstyled && 'rounded-md border', className)}>
      {header}
      <div className={cn('space-y-2', !unstyled && 'p-3')}>
        {statusBanner && (
          <GuardrailStatusBanner tone={statusBanner.tone} message={statusBanner.message} />
        )}
        <MixedScopesBanner otherAppliedScopes={mixedScopes} labels={labels} />
        {guardrails.length === 0 ? (
          // `??` would swallow an explicit `null`, which is how a host says "render nothing
          // when empty" (Agents shows only its add button).
          emptyState !== undefined ? (
            emptyState
          ) : (
            <p className="text-sm text-foreground-muted">{labels.emptyState}</p>
          )
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={DND_MODIFIERS}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
              <ul className="space-y-2">
                {guardrails.map((guardrail, index) => {
                  const state = resolveGuardrailListItemState(
                    guardrail,
                    definitions,
                    getItemOrigin?.(guardrail)
                  );
                  return (
                    <GuardrailListRow
                      key={sortableIds[index]}
                      id={sortableIds[index]}
                      guardrail={guardrail}
                      state={state}
                      labels={labels}
                      disabled={disabled}
                      sortable={sortable}
                      statusChips={statusChips}
                      previewChip={previewChip}
                      activatesEdit={rowActivatesEdit}
                      formatScopes={formatScopes}
                      formatAction={formatAction}
                      renderTooltip={renderRowTooltip}
                      onEdit={onEdit}
                      onRemove={onRemove}
                      renderActions={
                        renderItemActions &&
                        (() =>
                          renderItemActions({
                            guardrail,
                            state,
                            disabled,
                            edit: () => onEdit?.(guardrail),
                            remove: () => onRemove?.(guardrail),
                          }))
                      }
                    />
                  );
                })}
              </ul>
            </SortableContext>
          </DndContext>
        )}
        {footer}
      </div>
    </div>
  );
}
