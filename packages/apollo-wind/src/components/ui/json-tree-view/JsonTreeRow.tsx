import { ChevronDown, CircleCheck, Copy, Pencil, WrapText } from 'lucide-react';
import {
  type ComponentProps,
  createContext,
  type MouseEvent,
  type ReactNode,
  useContext,
  useRef,
} from 'react';
import { RequiredIndicator } from '@/components/ui/label';
import { cn } from '@/lib';
import {
  type FlatJsonTreeRow,
  formatLeafValue,
  isArrayItemTemplateRoot,
  isPathCollapsed,
} from './buildJsonTree';
import { DecorationChip } from './DecorationChip';
import { JsonContainerEditor } from './JsonContainerEditor';
import { JsonMultilineLeafEditor } from './JsonMultilineLeafEditor';
import type {
  CopyEvent,
  DeriveTypeIcon,
  JsonTreeNode,
  JsonTreeRowWrapper,
  JsonValue,
  NodeAction,
  NodeActionsResolver,
  NodeDecoration,
  PathForCopy,
  RenderCodeEditor,
  RenderValueCell,
} from './JsonTree.types';
import { JsonTypeBadge } from './JsonTypeBadge';
import { NodeKey } from './NodeKey';
import { RowActions } from './RowActions';
import { ScalarValueCell, valueColorClass } from './ScalarValueCell';
import { useJsonTreeViewStrings } from './strings';
import {
  EDITOR_ATTR,
  isParentRow,
  SKIP_ATTR,
  type TreeGridCell,
  TreeGridTabbableContext,
} from './treeGrid';

// min-h keeps the row height constant between view and edit: the row actions
// occupy layout (at opacity-0) in the view state but are unmounted while
// editing, which would otherwise let the row collapse to the badge height.
const ROW_CLASS =
  'group flex min-h-7 cursor-default items-center gap-2 py-1 pr-1 transition hover:bg-surface-overlay';
/** `min-h-7` above (1.75rem) in px at the default root size: the virtualizer's estimate
 *  until each row is measured, so a different root size costs accuracy but not correctness. */
export const ROW_MIN_HEIGHT_PX = 28;

// Wrapper for a value cell. `flex-1` lets it fill the space between the key
// and the row actions, `min-w-8` keeps a sliver of it legible when squeezed.
const VALUE_CELL_CLASS = 'flex min-w-8 flex-1 items-center';

// The field-name cell. Capped so a pathologically long key truncates rather
// than pushing the value out of the row.
const NAME_CELL_CLASS = 'flex min-w-0 max-w-1/2 items-center gap-2';

// Inset so the ring stays inside the tree's clipped scroll box.
const FOCUS_RING_CLASS =
  'outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring';

// `group/row` reveals the row actions and hover-only sublabels while keyboard
// focus is anywhere in the row, the row element itself included.
const ROW_ELEMENT_CLASS = `group/row ${FOCUS_RING_CLASS}`;

// Rows have no right padding of their own: the trailing icon buttons carry
// enough internal padding to keep their glyphs off the edge.
function rowIndent(depth: number, extra = 0) {
  return { paddingLeft: `${8 + depth * 16 + extra}px` };
}

// Chevron slot (10) + gap (8) + badge (18) + gap (8): aligns nested blocks
// with the key text of their row.
const KEY_ALIGN_OFFSET = 44;

/**
 * A cell of the tree grid. A div rather than `<td>`: the row is a flex line,
 * rendered in a virtualized list, not a table. Focusable so a cell holding only
 * text can still take arrow-key focus.
 */
function GridCell({
  cell,
  editing = false,
  className,
  ...props
}: {
  cell: TreeGridCell;
  /** Holds an open editor, which keeps its own arrow keys. */
  editing?: boolean;
} & ComponentProps<'div'>) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: A table layout can't host the flex rows and virtualization.
    <div
      role="gridcell"
      data-cell={cell}
      tabIndex={-1}
      {...(editing && { [EDITOR_ATTR]: '' })}
      className={cn(FOCUS_RING_CLASS, className)}
      {...props}
    />
  );
}

/**
 * Shared, node-invariant context every row needs: the tree config, the mutable
 * edit/copy state, and the handlers that mutate it. Held once by `JsonTreeView` so
 * each `JsonTreeRow` only takes its own `row` and `index`.
 */
export interface JsonTreeRowContextValue {
  collapsed: Record<string, boolean>;
  onToggleCollapsed?: (path: string) => void;
  readOnly: boolean;
  decorateNode?: (node: JsonTreeNode) => NodeDecoration | undefined;
  deriveTypeIcon?: DeriveTypeIcon;
  renderValue?: RenderValueCell;
  nodeActions?: NodeActionsResolver;
  maxInlineActions: number;
  renderCodeEditor?: RenderCodeEditor;
  pathForCopy?: PathForCopy;
  /** Editability is row-invariant (props only), so it is resolved once. */
  canEdit: boolean;
  RowWrapper: JsonTreeRowWrapper;
  /** Localized label for the synthesized array-item preview row. */
  templateItemLabel: string;
  editingPath: string | null;
  jsonEditingPath: string | null;
  wrappedPaths: Record<string, boolean>;
  copied: { path: string; kind: CopyEvent['kind'] } | null;
  /** The row holding the tree's single Tab stop; null while an outer tree's row keeps this tree out of the Tab order. */
  tabStopPath: string | null;
  /**
   * Asks the tree to put focus back in the row once an editor closes, on the
   * control that opened it or else the first stop of `cell`.
   */
  restoreFocus: (path: string, cell: TreeGridCell) => void;
  setEditingPath: (path: string | null) => void;
  setJsonEditingPath: (path: string | null) => void;
  copyPath: (node: JsonTreeNode) => void;
  copyValue: (node: JsonTreeNode) => void;
  toggleWrapped: (node: JsonTreeNode) => void;
  commitEdit: (node: JsonTreeNode, value: JsonValue | undefined) => void;
}

const JsonTreeRowContext = createContext<JsonTreeRowContextValue | null>(null);

export const JsonTreeRowContextProvider = JsonTreeRowContext.Provider;

function useJsonTreeRowContext(): JsonTreeRowContextValue {
  const ctx = useContext(JsonTreeRowContext);
  if (!ctx) {
    throw new Error('JsonTreeRow must be rendered inside a JsonTreeRowContext provider');
  }
  return ctx;
}

/**
 * A single flattened tree row: the collapse chevron, type badge, field name,
 * decorations, and either the value cell (leaf) or key/item count (container),
 * plus the expanded wrapped-scalar and edit-as-JSON surfaces below it. All
 * shared state and handlers come from `JsonTreeRowContext`.
 */
export function JsonTreeRow({ row, index }: { row: FlatJsonTreeRow; index: number }) {
  const { node, depth } = row;
  const strings = useJsonTreeViewStrings();
  const rowRef = useRef<HTMLDivElement>(null);
  const {
    collapsed,
    onToggleCollapsed,
    readOnly,
    decorateNode,
    deriveTypeIcon,
    renderValue,
    nodeActions,
    maxInlineActions,
    renderCodeEditor,
    pathForCopy,
    canEdit,
    RowWrapper,
    templateItemLabel,
    editingPath,
    jsonEditingPath,
    wrappedPaths,
    copied,
    tabStopPath,
    restoreFocus,
    setEditingPath,
    setJsonEditingPath,
    copyPath,
    copyValue,
    toggleWrapped,
    commitEdit,
  } = useJsonTreeRowContext();
  const isTabStop = tabStopPath === node.path;

  // Keyboard commits and cancels leave focus in the editor that is about to
  // unmount; a blur commit has already sent it elsewhere and must not pull it back.
  const closeEditor = (cell: TreeGridCell) => {
    if (rowRef.current?.contains(document.activeElement)) restoreFocus(node.path, cell);
  };

  // Assembles the built-in trailing actions for a row (wrap / edit-as-JSON /
  // copy-value), in display order. A consumer's `nodeActions` composes with,
  // reorders, or replaces these. Kept out of the row JSX so the render body
  // reads as layout, not action wiring.
  const buildDefaultActions = (
    node: JsonTreeNode,
    flags: {
      isContainer: boolean;
      wrappable: boolean;
      wrapped: boolean;
      canCopyValue: boolean;
      copiedValue: boolean;
    }
  ): NodeAction[] => {
    const actions: NodeAction[] = [];
    if (flags.wrappable) {
      actions.push({
        id: 'wrap',
        icon: <WrapText />,
        active: flags.wrapped,
        tooltip: flags.wrapped ? strings.unwrapValue : strings.wrapValue,
        label: flags.wrapped ? strings.unwrapValueOf(node.key) : strings.wrapValueOf(node.key),
        onSelect: () => toggleWrapped(node),
      });
    }
    if (flags.isContainer && canEdit && !node.isArrayItemTemplate) {
      actions.push({
        id: 'edit-json',
        icon: <Pencil />,
        tooltip: strings.editAsJson,
        label: strings.editKeyAsJson(node.key),
        onSelect: () => setJsonEditingPath(node.path),
      });
    }
    if (flags.canCopyValue) {
      actions.push({
        id: 'copy-value',
        // The copied confirmation rides on the icon, not an active button
        // state, matching the pre-descriptor behavior.
        icon: flags.copiedValue ? <CircleCheck className="text-brand" /> : <Copy />,
        tooltip: strings.copyValue,
        label: strings.copyValueOf(node.key),
        onSelect: () => copyValue(node),
      });
    }
    return actions;
  };

  const isContainer = node.children !== undefined;
  // Preview nodes (array-item templates) illustrate the item shape;
  // they are never editable, even in an editable tree.
  const isTemplate = !!node.isArrayItemTemplate;
  const isTemplateItem = isArrayItemTemplateRoot(node);
  // The synthesized preview item is not a real element, so it stays
  // out of the array's item count (an empty array still reads "0").
  const childCount = node.children?.filter((c) => !isArrayItemTemplateRoot(c)).length ?? 0;
  const decoration = decorateNode?.(node);
  const customCell: ReactNode = renderValue?.(node, {
    readOnly,
    commit: (value) => commitEdit(node, value),
    clear: () => commitEdit(node, undefined),
  });
  const canCopyValue = node.value !== undefined;
  const wrappable =
    !isContainer &&
    customCell == null &&
    node.value !== undefined &&
    node.type !== 'boolean' &&
    !node.schema?.enum?.length;
  const wrapped = wrappable && !!wrappedPaths[node.path];
  const copiedValue = copied?.path === node.path && copied.kind === 'value';

  // Built-ins are assembled lazily: a consumer's `nodeActions` may
  // ignore `ctx.defaultActions` entirely (a fully custom list or
  // `[]`), so we only pay for the assembly when it is actually read —
  // or when there is no resolver. Memoized so repeated reads in one
  // resolver don't rebuild.
  let builtDefaults: NodeAction[] | undefined;
  const getDefaultActions = () => {
    builtDefaults ??= buildDefaultActions(node, {
      isContainer,
      wrappable,
      wrapped,
      canCopyValue,
      copiedValue,
    });
    return builtDefaults;
  };
  const actions =
    nodeActions?.(node, {
      readOnly,
      get defaultActions() {
        return getDefaultActions();
      },
      commit: (value) => commitEdit(node, value),
      clear: () => commitEdit(node, undefined),
    }) ?? getDefaultActions();

  // Container rows collapse/expand on a click anywhere in the row,
  // except on an interactive control (the chevron, the row actions,
  // an inline editor, or a dropdown trigger).
  const rowClickable = isContainer && !!onToggleCollapsed;
  const handleRowClick = (event: MouseEvent) => {
    if (
      (event.target as HTMLElement).closest(
        'button, a, input, textarea, select, [contenteditable="true"]'
      )
    ) {
      return;
    }
    onToggleCollapsed?.(node.path);
  };

  const collapsedHere = isContainer && isPathCollapsed(collapsed, node.path);
  const editingInline = editingPath === node.path && !wrapped;
  const showsValue =
    !isContainer &&
    !wrapped &&
    !decoration?.hideValue &&
    (customCell != null || !((readOnly && node.value === undefined) || isTemplate));
  const editingDetail =
    (wrapped && editingPath === node.path && canEdit) ||
    (isContainer && jsonEditingPath === node.path);

  return (
    // The row element itself is the grid row (not the consumer's `RowWrapper`),
    // so a wrapper's own role or tabindex can't take the row's place.
    // biome-ignore lint/a11y/useSemanticElements: A table layout can't host the flex rows and virtualization.
    <div
      ref={rowRef}
      role="row"
      data-path={node.path}
      tabIndex={isTabStop ? 0 : -1}
      aria-level={depth + 1}
      aria-posinset={row.posInSet}
      aria-setsize={row.setSize}
      aria-rowindex={index + 1}
      // Only a row with child rows to show or hide is a parent row; `{}` and `[]` are end rows.
      aria-expanded={isParentRow(row) ? !collapsedHere : undefined}
      className={ROW_ELEMENT_CLASS}
    >
      {/* A tree nested in a cell joins the Tab order only through the row holding this tree's stop. */}
      <TreeGridTabbableContext.Provider value={isTabStop}>
        <RowWrapper
          node={node}
          className={cn(ROW_CLASS, rowClickable && 'cursor-pointer')}
          style={rowIndent(depth)}
          onClick={rowClickable ? handleRowClick : undefined}
        >
          <GridCell cell="name" className={NAME_CELL_CLASS}>
            {isContainer ? (
              <button
                type="button"
                // A mouse affordance only: the row is the keyboard's expand/collapse control.
                tabIndex={-1}
                {...{ [SKIP_ATTR]: '' }}
                onClick={() => onToggleCollapsed?.(node.path)}
                // Without a handler the tree's expansion is fixed (e.g. a host holding
                // search matches open), so the chevron shows state but isn't a control.
                disabled={!onToggleCollapsed}
                aria-label={
                  collapsedHere ? strings.expandKey(node.key) : strings.collapseKey(node.key)
                }
                className="grid size-2.5 shrink-0 cursor-pointer place-items-center text-foreground-subtle transition hover:text-foreground disabled:cursor-default disabled:hover:text-foreground-subtle"
              >
                <ChevronDown
                  size={10}
                  className={cn('transition-transform duration-100', collapsedHere && '-rotate-90')}
                />
              </button>
            ) : (
              <div className="size-2.5 shrink-0" />
            )}
            <JsonTypeBadge
              type={node.type}
              icon={decoration?.badge?.icon ?? deriveTypeIcon?.(node)}
              className={decoration?.badge?.className}
              reference={decoration?.badge?.reference}
            />
            <NodeKey
              node={node}
              label={isTemplateItem ? templateItemLabel : decoration?.label}
              displayPath={pathForCopy?.(node.path, node.segments) ?? node.path}
              onCopyPath={copyPath}
              className={isTemplateItem ? 'font-normal italic text-foreground-subtle' : undefined}
            />
            {/* Clicking the key copies its path but dismisses the tooltip, so
              confirm the copy with an inline check (like copy-value). Hidden
              from assistive tech, which hears the tree's announcement instead. */}
            {copied?.path === node.path && copied.kind === 'path' && (
              <CircleCheck size={11} className="shrink-0 text-brand" aria-hidden />
            )}
            {decoration?.sublabel && (
              <span
                className={cn(
                  'min-w-0 truncate font-mono text-[10px] text-foreground-subtle leading-4',
                  decoration.sublabelOnHover &&
                    'hidden group-hover:block group-focus-within/row:block'
                )}
              >
                {decoration.sublabel}
              </span>
            )}
            {/* Explicit color: the row establishes none, so an inherited indicator
              would fall back to black. `ml-0` because the row already gaps. */}
            {node.required && (
              <RequiredIndicator
                className="ml-0 shrink-0 text-[10px] text-foreground"
                srLabel={strings.requiredMarker}
              />
            )}
          </GridCell>
          {isContainer ? (
            <GridCell
              cell="value"
              // A custom cell fills the row; without one the count stays beside the key.
              className={
                customCell != null
                  ? 'flex min-w-0 flex-1 items-center gap-2'
                  : 'flex min-w-0 items-center gap-2'
              }
            >
              {!decoration?.hideCount && (
                <span className="shrink-0 whitespace-nowrap font-mono italic text-[10px] text-foreground-subtle">
                  {node.type === 'array'
                    ? strings.itemCount(childCount)
                    : strings.keyCount(childCount)}
                </span>
              )}
              {customCell != null && <span className={VALUE_CELL_CLASS}>{customCell}</span>}
              <DecorationChip decoration={decoration} />
            </GridCell>
          ) : (
            <GridCell
              cell="value"
              editing={editingInline}
              // The built-in value shrinks before the key does; a custom cell keeps its own floor.
              className={
                showsValue
                  ? cn(VALUE_CELL_CLASS, 'gap-2', customCell == null && 'shrink-3')
                  : 'flex min-w-0 flex-1 items-center gap-2'
              }
            >
              {showsValue &&
                (customCell != null ? (
                  customCell
                ) : (
                  <>
                    <span className="shrink-0 font-mono text-xs text-foreground-subtle">=</span>
                    <ScalarValueCell
                      node={node}
                      readOnly={readOnly}
                      editing={editingPath === node.path}
                      onStartEdit={(n) => setEditingPath(n.path)}
                      onStopEdit={() => {
                        closeEditor('value');
                        setEditingPath(null);
                      }}
                      onEdit={canEdit ? commitEdit : undefined}
                    />
                  </>
                ))}
              {/* The cell fills the row, so `ml-auto` keeps the chip beside the actions. */}
              {editingPath !== node.path && decoration?.chip && (
                <span className="ml-auto flex min-w-0 items-center">
                  <DecorationChip decoration={decoration} />
                </span>
              )}
            </GridCell>
          )}
          <GridCell cell="actions" className="ml-auto flex shrink-0 items-center gap-2">
            {(isContainer || editingPath !== node.path) && (
              <RowActions
                node={node}
                actions={actions}
                maxInline={maxInlineActions}
                meta={decoration?.meta}
              />
            )}
          </GridCell>
        </RowWrapper>

        {/* Wrapped scalar: full value below the field name, wrapping. */}
        {wrapped && (
          <GridCell
            cell="detail"
            editing={editingDetail}
            className="pb-1.5 pr-3.5"
            style={rowIndent(depth, KEY_ALIGN_OFFSET)}
          >
            {editingPath === node.path && canEdit ? (
              <JsonMultilineLeafEditor
                node={node}
                onCommit={(value) => {
                  closeEditor('detail');
                  setEditingPath(null);
                  commitEdit(node, value);
                }}
                onCancel={() => {
                  closeEditor('detail');
                  setEditingPath(null);
                }}
              />
            ) : (
              <button
                type="button"
                disabled={!canEdit}
                onClick={() => setEditingPath(node.path)}
                aria-label={strings.editValueOf(node.key)}
                title={canEdit ? strings.editHint : undefined}
                className={cn(
                  'w-full whitespace-pre-wrap break-all rounded text-left font-mono text-xs leading-5',
                  canEdit && 'cursor-text',
                  valueColorClass(node.type, node.value)
                )}
              >
                {/* Quoted like the collapsed row, but otherwise verbatim: real
                  line breaks, no escape sequences. */}
                {formatLeafValue(node.type, node.value, { preserveStringWhitespace: true })}
              </button>
            )}
          </GridCell>
        )}

        {isContainer && jsonEditingPath === node.path && (
          <GridCell
            cell="detail"
            editing
            className="py-1.5 pr-3.5"
            style={rowIndent(depth, KEY_ALIGN_OFFSET)}
          >
            <JsonContainerEditor
              node={node}
              onCommit={(value) => {
                closeEditor('actions');
                setJsonEditingPath(null);
                commitEdit(node, value);
              }}
              onCancel={() => {
                closeEditor('actions');
                setJsonEditingPath(null);
              }}
              renderCodeEditor={renderCodeEditor}
            />
          </GridCell>
        )}
      </TreeGridTabbableContext.Provider>
    </div>
  );
}
