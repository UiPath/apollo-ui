import { cn } from '@/lib';
import { RequiredIndicator } from '@/components/ui/label';
import { ChevronDown, CircleCheck, Copy, Pencil, WrapText } from 'lucide-react';
import { createContext, type MouseEvent, type ReactNode, useContext } from 'react';
import { useJsonTreeViewStrings } from './strings';
import { formatLeafValue, isArrayItemTemplateRoot, isPathCollapsed } from './buildJsonTree';
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

// Rows have no right padding of their own: the trailing icon buttons carry
// enough internal padding to keep their glyphs off the edge.
function rowIndent(depth: number, extra = 0) {
  return { paddingLeft: `${8 + depth * 16 + extra}px` };
}

// Chevron slot (10) + gap (8) + badge (18) + gap (8): aligns nested blocks
// with the key text of their row.
const KEY_ALIGN_OFFSET = 44;

/**
 * Shared, node-invariant context every row needs: the tree config, the mutable
 * edit/copy state, and the handlers that mutate it. Held once by `JsonTreeView` so
 * each `JsonTreeRow` only takes its own `node`/`depth`.
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
export function JsonTreeRow({ node, depth }: { node: JsonTreeNode; depth: number }) {
  const strings = useJsonTreeViewStrings();
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
    setEditingPath,
    setJsonEditingPath,
    copyPath,
    copyValue,
    toggleWrapped,
    commitEdit,
  } = useJsonTreeRowContext();

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

  return (
    <div>
      <RowWrapper
        node={node}
        className={cn(ROW_CLASS, rowClickable && 'cursor-pointer')}
        style={rowIndent(depth)}
        onClick={rowClickable ? handleRowClick : undefined}
      >
        {isContainer ? (
          <button
            type="button"
            onClick={() => onToggleCollapsed?.(node.path)}
            // Without a handler the tree's expansion is fixed (e.g. a host holding
            // search matches open), so the chevron shows state but isn't a control.
            disabled={!onToggleCollapsed}
            aria-label={
              isPathCollapsed(collapsed, node.path)
                ? strings.expandKey(node.key)
                : strings.collapseKey(node.key)
            }
            aria-expanded={!isPathCollapsed(collapsed, node.path)}
            className="grid size-2.5 shrink-0 cursor-pointer place-items-center text-foreground-subtle transition hover:text-foreground disabled:cursor-default disabled:hover:text-foreground-subtle"
          >
            <ChevronDown
              size={10}
              className={cn(
                'transition-transform duration-100',
                isPathCollapsed(collapsed, node.path) && '-rotate-90'
              )}
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
        {/* Clicking the key copies its path but dismisses the tooltip,
            so confirm the copy with an inline check (like copy-value). */}
        {copied?.path === node.path && copied.kind === 'path' && (
          <CircleCheck
            size={11}
            className="shrink-0 text-brand"
            role="img"
            aria-label={strings.pathCopied}
          />
        )}
        {decoration?.sublabel && (
          <span
            className={cn(
              'min-w-0 truncate font-mono text-[10px] text-foreground-subtle leading-4',
              decoration.sublabelOnHover && 'hidden group-hover:block group-focus-within:block'
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
        {isContainer ? (
          <>
            {!decoration?.hideCount && (
              <span className="shrink-0 whitespace-nowrap font-mono italic text-[10px] text-foreground-subtle">
                {node.type === 'array'
                  ? strings.itemCount(childCount)
                  : strings.keyCount(childCount)}
              </span>
            )}
            {customCell != null && <span className={VALUE_CELL_CLASS}>{customCell}</span>}
            <DecorationChip decoration={decoration} />
            <RowActions
              node={node}
              actions={actions}
              maxInline={maxInlineActions}
              meta={decoration?.meta}
            />
          </>
        ) : (
          <>
            {!wrapped &&
              !decoration?.hideValue &&
              (customCell != null ? (
                <span className={VALUE_CELL_CLASS}>{customCell}</span>
              ) : (
                !((readOnly && node.value === undefined) || isTemplate) && (
                  <>
                    <span className="shrink-0 font-mono text-xs text-foreground-subtle">=</span>
                    <span className={cn(VALUE_CELL_CLASS, 'shrink-3')}>
                      <ScalarValueCell
                        node={node}
                        readOnly={readOnly}
                        editing={editingPath === node.path}
                        onStartEdit={(n) => setEditingPath(n.path)}
                        onStopEdit={() => setEditingPath(null)}
                        onEdit={canEdit ? commitEdit : undefined}
                      />
                    </span>
                  </>
                )
              ))}
            {editingPath !== node.path && (
              <>
                <DecorationChip decoration={decoration} />
                <RowActions
                  node={node}
                  actions={actions}
                  maxInline={maxInlineActions}
                  meta={decoration?.meta}
                />
              </>
            )}
          </>
        )}
      </RowWrapper>

      {/* Wrapped scalar: full value below the field name, wrapping. */}
      {wrapped && (
        <div className="pb-1.5 pr-3.5" style={rowIndent(depth, KEY_ALIGN_OFFSET)}>
          {editingPath === node.path && canEdit ? (
            <JsonMultilineLeafEditor
              node={node}
              onCommit={(value) => {
                setEditingPath(null);
                commitEdit(node, value);
              }}
              onCancel={() => setEditingPath(null)}
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
        </div>
      )}

      {isContainer && jsonEditingPath === node.path && (
        <div className="py-1.5 pr-3.5" style={rowIndent(depth, KEY_ALIGN_OFFSET)}>
          <JsonContainerEditor
            node={node}
            onCommit={(value) => {
              setJsonEditingPath(null);
              commitEdit(node, value);
            }}
            onCancel={() => setJsonEditingPath(null)}
            renderCodeEditor={renderCodeEditor}
          />
        </div>
      )}
    </div>
  );
}
