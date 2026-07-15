import { cn } from '@uipath/apollo-wind';
import { TooltipProvider } from '@uipath/apollo-wind/components/ui/tooltip';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSafeLingui } from '../../../i18n';
import { CanvasTooltipProviderMarker } from '../CanvasTooltip';
import { flattenJsonTree } from './buildJsonTree';
import { copyTextToClipboard } from './clipboard';
import type {
  CopyEvent,
  DeriveTypeIcon,
  JsonTreeNode,
  JsonTreeRowWrapper,
  JsonValue,
  NodeActionsResolver,
  NodeDecoration,
  RenderCodeEditor,
  RenderValueCell,
} from './JsonTree.types';
import {
  JsonTreeRow,
  JsonTreeRowContextProvider,
  type JsonTreeRowContextValue,
} from './JsonTreeRow';

export interface JsonTreeProps {
  /** Tree built with `buildJsonTree`. */
  nodes: JsonTreeNode[];
  /** Collapsed container paths. */
  collapsed?: Record<string, boolean>;
  onToggleCollapsed?: (path: string) => void;
  /** Search query matched against keys and scalar values. */
  query?: string;
  /**
   * Rows are kept when the node (or any descendant) matches; a node that
   * matches directly shows its whole subtree.
   */
  filterPredicate?: (node: JsonTreeNode) => boolean;
  /** Hides all editing affordances. */
  readOnly?: boolean;
  /** Called with the node and its new value after an inline edit. Undefined removes the value. */
  onEdit?: (node: JsonTreeNode, value: JsonValue | undefined) => void;
  /**
   * Custom row container (e.g. to make rows drag sources). Renders `children`
   * inside a single element applying `className`/`style`. Must be a stable
   * component reference (module scope or memoized), not an inline arrow.
   */
  rowWrapper?: JsonTreeRowWrapper;
  /** Per-node visual annotations (labels, chips, badge overrides). None by default. */
  decorateNode?: (node: JsonTreeNode) => NodeDecoration | undefined;
  /** Custom type-badge icons per node. Return undefined to keep the default type icon. */
  deriveTypeIcon?: DeriveTypeIcon;
  /** Custom value cell renderer; return undefined to keep the default cell. */
  renderValue?: RenderValueCell;
  /**
   * Customizes the trailing row actions per node: compose with the built-ins
   * via `ctx.defaultActions`, return `[]` to omit them, or `undefined` to keep
   * the defaults.
   */
  nodeActions?: NodeActionsResolver;
  /**
   * Maximum row actions shown inline before the surplus collapses into an
   * overflow menu. Default 3.
   */
  maxInlineActions?: number;
  /** Renders the object/array editing surface as a code editor (defaults to a textarea). */
  renderCodeEditor?: RenderCodeEditor;
  /** Builds the text copied when a field name is clicked. Defaults to the path itself. */
  pathForCopy?: (path: string) => string;
  /** Called after something is copied to the clipboard. */
  onCopy?: (event: CopyEvent) => void;
  emptyMessage?: string;
  className?: string;
}

function valueAsText(node: JsonTreeNode): string {
  if (typeof node.value === 'string') return node.value;
  if (node.value === undefined) return 'null';
  return JSON.stringify(node.value, null, 2);
}

const DefaultRowWrapper: JsonTreeRowWrapper = ({ className, style, onClick, children }) => (
  <div className={className} style={style} onClick={onClick}>
    {children}
  </div>
);

/**
 * Interactive tree of a JSON value merged with its schema. Containers
 * collapse, leaves edit inline (all JSON types), field names copy their
 * path, and the row actions copy the value or wrap long scalars
 * into a full-width block with a multiline editor.
 */
export function JsonTree({
  nodes,
  collapsed = {},
  onToggleCollapsed,
  query,
  filterPredicate,
  readOnly = false,
  onEdit,
  rowWrapper,
  decorateNode,
  deriveTypeIcon,
  renderValue,
  nodeActions,
  maxInlineActions = 3,
  renderCodeEditor,
  pathForCopy,
  onCopy,
  emptyMessage,
  className,
}: JsonTreeProps) {
  const { _ } = useSafeLingui();
  const RowWrapper = rowWrapper ?? DefaultRowWrapper;
  const [editingPath, setEditingPath] = useState<string | null>(null);
  const [jsonEditingPath, setJsonEditingPath] = useState<string | null>(null);
  const [wrappedPaths, setWrappedPaths] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<{
    path: string;
    kind: CopyEvent['kind'];
  } | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    },
    []
  );

  const copy = (node: JsonTreeNode, kind: CopyEvent['kind'], text: string) => {
    void copyTextToClipboard(text).then((ok) => {
      // Both fallback paths failed: nothing reached the clipboard, so neither
      // the inline confirmation nor the consumer callback should fire.
      if (!ok) return;
      setCopied({ path: node.path, kind });
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopied(null), 1500);
      onCopy?.({ kind, path: node.path, text });
    });
  };

  const copyPath = (node: JsonTreeNode) =>
    copy(node, 'path', pathForCopy?.(node.path) ?? node.path);
  const copyValue = (node: JsonTreeNode) => copy(node, 'value', valueAsText(node));

  const toggleWrapped = (node: JsonTreeNode) => {
    setWrappedPaths((prev) => ({ ...prev, [node.path]: !prev[node.path] }));
    if (editingPath === node.path) setEditingPath(null);
  };

  const commitEdit = (node: JsonTreeNode, value: JsonValue | undefined) => onEdit?.(node, value);

  // Editability is row-invariant (props only), so resolve it once.
  const canEdit = !readOnly && !!onEdit;

  // Flattening walks the whole tree (and search re-checks descendants per
  // node), so gate it on its actual inputs instead of re-running on every
  // hover/copy/edit state tick.
  const rows = useMemo(
    () =>
      flattenJsonTree(nodes, {
        collapsed,
        query,
        filterPredicate,
        displayTexts: decorateNode,
      }),
    [nodes, collapsed, query, filterPredicate, decorateNode]
  );
  // Label for the synthesized array-item preview row (shown instead of an
  // index, since it is not a real element).
  const templateItemLabel = _({
    id: 'canvas.json_value_panel.array_item',
    message: 'item',
  });
  const filtering = !!query?.trim() || !!filterPredicate;
  const resolvedEmptyMessage = filtering
    ? _({
        id: 'canvas.json_value_panel.empty_search',
        message: 'No fields match your search.',
      })
    : (emptyMessage ??
      _({
        id: 'canvas.json_value_panel.empty_default',
        message: 'No fields to display.',
      }));

  // Every row shares this state and these handlers; holding it once here keeps
  // each JsonTreeRow to just its own node/depth.
  const rowContext: JsonTreeRowContextValue = {
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
  };

  return (
    // One shared tooltip provider for all field-name tooltips; the marker
    // stops each CanvasTooltip from mounting its own fallback provider.
    <TooltipProvider delayDuration={300} skipDelayDuration={100}>
      <CanvasTooltipProviderMarker>
        <JsonTreeRowContextProvider value={rowContext}>
          <div className={cn('h-full overflow-y-auto overflow-x-hidden', className)}>
            {rows.map(({ node, depth }) => (
              <JsonTreeRow key={node.path} node={node} depth={depth} />
            ))}
            {rows.length === 0 && (
              <span className="py-4 text-center text-xs text-foreground-subtle">
                {resolvedEmptyMessage}
              </span>
            )}
          </div>
        </JsonTreeRowContextProvider>
      </CanvasTooltipProviderMarker>
    </TooltipProvider>
  );
}
