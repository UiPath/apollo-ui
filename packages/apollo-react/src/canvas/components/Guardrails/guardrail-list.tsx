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
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button, cn } from '@uipath/apollo-wind';
import { GripVertical, Plus, Shield } from 'lucide-react';
import { type ReactNode, useCallback, useMemo } from 'react';
import { GuardrailListRow, type GuardrailListRowProps } from './components/guardrail-list-row';
import { getGuardrailListItemId, resolveGuardrailListItemState } from './guardrail-list-utils';
import {
  formatGuardrailFormMessage,
  type GuardrailListLabels,
  useGuardrailListLabels,
} from './i18n';
import type {
  GuardrailListAdministration,
  GuardrailListDefinition,
  GuardrailListItem,
  GuardrailListItemActionsContext,
  GuardrailReorderMove,
} from './list-types';

const DND_MODIFIERS = [restrictToVerticalAxis, restrictToParentElement];
// A pointer has to travel before a press becomes a drag, or clicking a row's body to edit it
// registers as a nudge instead. Both products already use 8px.
const POINTER_SENSOR_OPTIONS = { activationConstraint: { distance: 8 } };

export interface GuardrailListProps {
  /**
   * The rows to render, in order, already filtered by the host: feature flags, entitlements
   * and scope filtering never cross this boundary. The list renders every item it is given.
   */
  guardrails: GuardrailListItem[];
  /**
   * Definitions the rows resolve against, already filtered by the host. Used only to derive
   * the provider line, the two BYO notices and the status chip; rows with no matching
   * definition still render.
   */
  definitions?: GuardrailListDefinition[];
  /** Read-only: suppresses add, edit and remove. Reorder follows `reorderDisabled`. */
  disabled?: boolean;
  /**
   * Whether reordering is off. Defaults to `disabled`, which is Agents' behaviour; Flow keeps
   * its read-only list reorderable and passes `false`. With reorder off no drag machinery is
   * mounted at all.
   */
  reorderDisabled?: boolean;

  /** Open the editor for a row. The row body activates it too when `rowActivatesEdit` is set. */
  onEdit?: (item: GuardrailListItem) => void;
  /**
   * Request removal of a row. An intent, not a mutation: the confirmation dialog, the
   * scoped-removal unwind and the write stay host-side, because the two products confirm with
   * different copy and unwind tool-scoped guardrails differently.
   */
  onRemove?: (item: GuardrailListItem) => void;
  /** Add affordance intent (header button, or whatever `addSlot` / `footer` render). */
  onAdd?: () => void;
  /**
   * Reorder intent. Receives the reordered **visible** array plus the move, so a host
   * rendering a filtered view (Flow's per-tool view over an agent-level list) can splice the
   * result back without this component knowing a fuller list exists.
   */
  onReorder?: (guardrails: GuardrailListItem[], move: GuardrailReorderMove) => void;

  /** Row identity. Defaults to `id ?? name`; must be stable and unique. */
  getItemId?: (item: GuardrailListItem) => string;
  /**
   * Who administers a row. Defaults to `'local'`, which renders no chip. Governance-managed
   * guardrails come from a different endpoint, so nothing on the record identifies them.
   */
  getItemAdministration?: (item: GuardrailListItem) => GuardrailListAdministration | undefined;

  /** Render the status and administration chips. Off: neither product shows them today. */
  statusChips?: boolean;
  /** Render the "Preview" badge on built-in-validator rows. Product lifecycle, not a package concern. */
  previewChip?: boolean;
  /** Drop the card border and padding, for hosts that already own the section chrome. */
  unstyled?: boolean;
  /** Hide the header (title and add affordance) when the host renders its own. */
  hideHeader?: boolean;
  /** Make the row body a button that opens the editor. */
  rowActivatesEdit?: boolean;
  /** Replaces the default empty line. Pass `null` to render nothing when the list is empty. */
  emptyState?: ReactNode;
  /** Rendered under the rows, e.g. an add affordance that doubles as an entitlement notice. */
  footer?: ReactNode;
  /** Replaces the header's add button, e.g. with an entitlement lock. */
  addSlot?: ReactNode;
  /** Rendered above the rows, e.g. `GuardrailStatusBanner` for a definitions load failure. */
  statusBanner?: ReactNode;

  /** Hover content for a row's body. Return nothing to leave that row untooltipped. */
  renderRowTooltip?: GuardrailListRowProps['renderRowTooltip'];
  /** Replace a row's inline actions, e.g. with an overflow menu. */
  renderItemActions?: (ctx: GuardrailListItemActionsContext) => ReactNode;
  /** Localize a row's scopes line. Return `null` to hide it. Default: raw scopes, comma-joined. */
  formatScopes?: (item: GuardrailListItem) => ReactNode;
  /** Localize a row's action badge. Return `null` to hide it. Default: the raw action type. */
  formatAction?: (item: GuardrailListItem) => ReactNode;

  labels?: Partial<GuardrailListLabels>;
  className?: string;
}

type SortableRowProps = Omit<GuardrailListRowProps, 'handle'>;

/**
 * A row inside a `DndContext`. Mounted only when the list is reorderable, so `useSortable`
 * never runs outside its provider, and a non-reorderable list carries no drag state at all.
 */
function SortableGuardrailRow({ id, item, labels, ...rowProps }: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const handle = (
    <Button
      ref={setActivatorNodeRef}
      type="button"
      variant="ghost"
      size="sm"
      icon
      // Only the left side is pulled back, so the glyph stays optically aligned with the row's
      // leading edge while the row's own `gap-2` still separates the handle from the name. A
      // negative right margin would cancel that gap and sit the hover box against the text.
      className="-ml-2 cursor-grab touch-none"
      // A real button, unlike Agents' aria-hidden icon: the handle is the only way to reorder,
      // so it has to be reachable and operable from the keyboard.
      aria-label={formatGuardrailFormMessage(labels.reorderItem, { name: item.name })}
      {...attributes}
      {...listeners}
    >
      <GripVertical />
    </Button>
  );

  return (
    <GuardrailListRow
      ref={setNodeRef}
      id={id}
      item={item}
      labels={labels}
      handle={handle}
      style={{
        // Translate, never Transform: `useSortable` derives its layout-change transform from the
        // row's before and after rects, so with variable row heights (a description line, a BYO
        // notice) `CSS.Transform` emits a `scaleY` that visibly squashes or stretches the row's
        // text while it animates. `verticalListSortingStrategy` never produces a scale of its own,
        // so dropping it costs nothing.
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : undefined,
      }}
      {...rowProps}
    />
  );
}

/**
 * The guardrails applied to an agent or a tool: an ordered, reorderable list of rows with
 * add, edit and remove affordances.
 *
 * The host filters, this renders. Every callback is an intent, so dialogs, persistence and
 * telemetry stay with the product, and every addition beyond what both products already show
 * is opt-in, so adopting this behind a flag renders what the host renders today.
 */
export function GuardrailList({
  guardrails,
  definitions,
  disabled = false,
  reorderDisabled,
  onEdit,
  onRemove,
  onAdd,
  onReorder,
  getItemId = getGuardrailListItemId,
  getItemAdministration,
  statusChips = false,
  previewChip = false,
  unstyled = false,
  hideHeader = false,
  rowActivatesEdit = false,
  emptyState,
  footer,
  addSlot,
  statusBanner,
  renderRowTooltip,
  renderItemActions,
  formatScopes,
  formatAction,
  labels: labelOverrides,
  className,
}: GuardrailListProps) {
  const labels = useGuardrailListLabels(labelOverrides);

  const sensors = useSensors(
    useSensor(PointerSensor, POINTER_SENSOR_OPTIONS),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const rows = useMemo(
    () => guardrails.map((item) => ({ item, id: getItemId(item) })),
    [guardrails, getItemId]
  );
  const ids = useMemo(() => rows.map((row) => row.id), [rows]);
  const isReorderable =
    !(reorderDisabled ?? disabled) && onReorder !== undefined && guardrails.length > 1;

  const handleDragEnd = useCallback(
    ({ active, over }: DragEndEvent) => {
      if (!onReorder || !over || active.id === over.id) return;
      const from = ids.indexOf(String(active.id));
      const to = ids.indexOf(String(over.id));
      if (from === -1 || to === -1) return;
      // `active.id` is the row id `getItemId` produced, so the move needs no index lookup.
      onReorder(arrayMove(guardrails, from, to), { from, to, id: String(active.id) });
    },
    [guardrails, ids, onReorder]
  );

  const renderedRows = rows.map(({ item, id }, index) => {
    const rowProps: Omit<GuardrailListRowProps, 'handle'> = {
      item,
      id,
      index,
      state: resolveGuardrailListItemState(item, definitions),
      labels,
      disabled,
      administration: getItemAdministration?.(item),
      statusChips,
      previewChip,
      rowActivatesEdit,
      onEdit,
      onRemove,
      renderRowTooltip,
      renderItemActions,
      formatScopes,
      formatAction,
    };
    return isReorderable ? (
      <SortableGuardrailRow key={id} {...rowProps} />
    ) : (
      <GuardrailListRow key={id} {...rowProps} />
    );
  });

  const content =
    guardrails.length > 0 ? (
      <div className="space-y-2">{renderedRows}</div>
    ) : // An explicit `null` hides the empty line; only an absent prop takes the default.
    emptyState === undefined ? (
      <p className="text-sm text-muted-foreground">{labels.empty}</p>
    ) : (
      emptyState
    );

  return (
    <div data-slot="guardrail-list" className={cn(!unstyled && 'rounded-md border', className)}>
      {!hideHeader && (
        <div className={cn('flex items-center justify-between', !unstyled && 'px-3 py-2')}>
          <div className="flex items-center gap-2">
            <Shield className="size-4 text-muted-foreground" aria-hidden="true" />
            <span className="text-sm font-medium">{labels.title}</span>
          </div>
          {addSlot !== undefined
            ? addSlot
            : onAdd && (
                <Button
                  type="button"
                  variant="text"
                  size="2xs"
                  className="w-fit p-0"
                  disabled={disabled}
                  onClick={onAdd}
                >
                  <Plus />
                  {labels.add}
                </Button>
              )}
        </div>
      )}
      <div className={cn('space-y-2', !unstyled && 'p-3')}>
        {statusBanner}
        {isReorderable ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={DND_MODIFIERS}
            // The list lives in a properties panel that scrolls on its own; dnd-kit's
            // auto-scroll fights it.
            autoScroll={false}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={ids} strategy={verticalListSortingStrategy}>
              {content}
            </SortableContext>
          </DndContext>
        ) : (
          content
        )}
        {footer}
      </div>
    </div>
  );
}
