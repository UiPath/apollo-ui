import { cn } from '@uipath/apollo-wind';
import { ChevronDown, CircleCheck, Copy, Pencil, WrapText } from 'lucide-react';
import { createContext, type MouseEvent, type ReactNode, useContext } from 'react';
import { useSafeLingui } from '../../../i18n';
import { formatLeafValue, isArrayItemTemplateRoot } from './buildJsonTree';
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
  'group flex min-h-7 cursor-default items-center gap-1.5 py-1 pr-1 transition hover:bg-surface-overlay';

// Wrapper for a consumer-supplied value cell. `flex-1 min-w-0` lets it fill
// the space between the key and the row actions and collapse when squeezed;
// `overflow-hidden` clips consumer content that doesn't truncate itself so it
// can never paint over the trailing row actions.
const CUSTOM_CELL_CLASS = 'flex min-w-0 flex-1 items-center overflow-hidden';

// Rows have no right padding of their own: the trailing icon buttons carry
// enough internal padding to keep their glyphs off the edge.
function rowIndent(depth: number, extra = 0) {
  return { paddingLeft: `${6 + depth * 12 + extra}px` };
}

// Chevron slot (10) + gap (8) + badge (18) + gap (8): aligns nested blocks
// with the key text of their row.
const KEY_ALIGN_OFFSET = 44;

/**
 * Shared, node-invariant context every row needs: the tree config, the mutable
 * edit/copy state, and the handlers that mutate it. Held once by `JsonTree` so
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
  pathForCopy?: (path: string) => string;
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
  const { _ } = useSafeLingui();
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
        tooltip: flags.wrapped
          ? _({
              id: 'canvas.json_value_panel.unwrap_value',
              message: 'Unwrap value',
            })
          : _({
              id: 'canvas.json_value_panel.wrap_value',
              message: 'Wrap value',
            }),
        label: flags.wrapped
          ? _({
              id: 'canvas.json_value_panel.unwrap_value_of',
              message: 'Unwrap value of {key}',
              values: { key: node.key },
            })
          : _({
              id: 'canvas.json_value_panel.wrap_value_of',
              message: 'Wrap value of {key}',
              values: { key: node.key },
            }),
        onSelect: () => toggleWrapped(node),
      });
    }
    if (flags.isContainer && canEdit && !node.isArrayItemTemplate) {
      actions.push({
        id: 'edit-json',
        icon: <Pencil />,
        tooltip: _({
          id: 'canvas.json_value_panel.edit_as_json',
          message: 'Edit as JSON',
        }),
        label: _({
          id: 'canvas.json_value_panel.edit_key_as_json',
          message: 'Edit {key} as JSON',
          values: { key: node.key },
        }),
        onSelect: () => setJsonEditingPath(node.path),
      });
    }
    if (flags.canCopyValue) {
      actions.push({
        id: 'copy-value',
        // The copied confirmation rides on the icon, not an active button
        // state, matching the pre-descriptor behavior.
        icon: flags.copiedValue ? <CircleCheck className="text-brand" /> : <Copy />,
        tooltip: _({
          id: 'canvas.json_value_panel.copy_value',
          message: 'Copy value',
        }),
        label: _({
          id: 'canvas.json_value_panel.copy_value_of',
          message: 'Copy value of {key}',
          values: { key: node.key },
        }),
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
            aria-label={
              collapsed[node.path]
                ? _({
                    id: 'canvas.json_value_panel.expand_key',
                    message: 'Expand {key}',
                    values: { key: node.key },
                  })
                : _({
                    id: 'canvas.json_value_panel.collapse_key',
                    message: 'Collapse {key}',
                    values: { key: node.key },
                  })
            }
            aria-expanded={!collapsed[node.path]}
            className="grid size-2.5 shrink-0 cursor-pointer place-items-center text-foreground-subtle transition hover:text-foreground"
          >
            <ChevronDown
              size={10}
              className={cn(
                'transition-transform duration-100',
                collapsed[node.path] && '-rotate-90'
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
        />
        <NodeKey
          node={node}
          label={isTemplateItem ? templateItemLabel : decoration?.label}
          displayPath={pathForCopy?.(node.path) ?? node.path}
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
            aria-label={_({
              id: 'canvas.json_value_panel.path_copied',
              message: 'Path copied',
            })}
          />
        )}
        {decoration?.sublabel && (
          <span className="min-w-0 truncate font-mono text-[10px] text-foreground-subtle leading-4">
            {decoration.sublabel}
          </span>
        )}
        {/* `*` is presentational; the sr-only span carries the semantic so
            screen readers don't announce a bare asterisk. */}
        {node.required && (
          <span className="shrink-0 text-[10px] text-error">
            <span aria-hidden="true">*</span>
            <span className="sr-only">
              {_({
                id: 'canvas.json_value_panel.required_marker',
                message: 'required',
              })}
            </span>
          </span>
        )}
        {isContainer ? (
          <>
            {!decoration?.hideCount && (
              <span className="shrink-0 whitespace-nowrap font-mono italic text-[10px] text-foreground-subtle">
                {node.type === 'array'
                  ? _({
                      id: 'canvas.json_value_panel.item_count',
                      message: '{count, plural, one {# item} other {# items}}',
                      values: { count: childCount },
                    })
                  : _({
                      id: 'canvas.json_value_panel.key_count',
                      message: '{count, plural, one {# key} other {# keys}}',
                      values: { count: childCount },
                    })}
              </span>
            )}
            {customCell != null && <span className={CUSTOM_CELL_CLASS}>{customCell}</span>}
            <DecorationChip decoration={decoration} />
            <RowActions node={node} actions={actions} maxInline={maxInlineActions} />
          </>
        ) : (
          <>
            {!wrapped &&
              (customCell != null ? (
                <span className={CUSTOM_CELL_CLASS}>{customCell}</span>
              ) : (
                !((readOnly && node.value === undefined) || isTemplate) && (
                  <>
                    <span className="shrink-0 font-mono text-xs text-foreground-subtle">=</span>
                    <ScalarValueCell
                      node={node}
                      readOnly={readOnly}
                      editing={editingPath === node.path}
                      onStartEdit={(n) => setEditingPath(n.path)}
                      onStopEdit={() => setEditingPath(null)}
                      onEdit={canEdit ? commitEdit : undefined}
                    />
                  </>
                )
              ))}
            {editingPath !== node.path && (
              <>
                <DecorationChip decoration={decoration} />
                <RowActions node={node} actions={actions} maxInline={maxInlineActions} />
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
              aria-label={_({
                id: 'canvas.json_value_panel.edit_value_of',
                message: 'Edit value of {key}',
                values: { key: node.key },
              })}
              title={
                canEdit
                  ? _({
                      id: 'canvas.json_value_panel.edit_hint',
                      message: 'Click to edit',
                    })
                  : undefined
              }
              className={cn(
                'w-full whitespace-pre-wrap break-all rounded text-left font-mono text-xs leading-5',
                canEdit && 'cursor-text',
                valueColorClass(node.type, node.value)
              )}
            >
              {/* Strings render raw (real line breaks, no quotes),
                  matching what the multiline editor shows. */}
              {typeof node.value === 'string' ? node.value : formatLeafValue(node.type, node.value)}
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
