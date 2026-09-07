import { useVirtualizer, type VirtualItem } from '@tanstack/react-virtual';
import { cn } from '@uipath/apollo-wind';
import { TooltipProvider } from '@uipath/apollo-wind/components/ui/tooltip';
import { type RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSafeLingui } from '../../../i18n';
import { useIsomorphicLayoutEffect } from '../../hooks/useIsomorphicLayoutEffect';
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
  ROW_MIN_HEIGHT_PX,
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
  /**
   * Mounts only the rows in view (plus a small overscan) instead of every row,
   * for values with thousands of fields. Rows are measured, so wrapped values
   * and inline editors keep their height. The tree scrolls inside its own box,
   * capped at the viewport height, unless `scrollElement` names the scroller.
   * Off by default.
   */
  virtualized?: boolean;
  /**
   * With `virtualized`, the ancestor that scrolls the tree. The tree then grows
   * to its content and windows its rows by that element's scroll position, so
   * the panel keeps its single scrollbar. The element must be height-bound: one
   * that grows with its content never scrolls, and every row would count as in
   * view.
   */
  scrollElement?: HTMLElement | null;
  emptyMessage?: string;
  className?: string;
}

type FlatRows = ReturnType<typeof flattenJsonTree>;

const VIRTUAL_OVERSCAN = 10;

/** Where the tree's top sits in the scroll element's content, so row offsets stay relative to the tree. */
function scrollMarginOf(element: HTMLElement, scrollElement: HTMLElement): number {
  // Whole pixels: sub-pixel drift between renders would otherwise update state every frame.
  return Math.round(
    element.getBoundingClientRect().top -
      scrollElement.getBoundingClientRect().top +
      scrollElement.scrollTop
  );
}

/**
 * Scrolls against the consumer's `scrollElement` when given, else the tree's own
 * container. Either must be height-bound: an overflow box that grows with its
 * content never scrolls, so every row would count as "in view" and mount —
 * which is why the own container is capped at the viewport height.
 */
function VirtualRows({
  rows,
  containerRef,
  scrollElement,
  pinnedPaths,
}: {
  rows: FlatRows;
  containerRef: RefObject<HTMLDivElement | null>;
  scrollElement?: HTMLElement | null;
  /** Rows that must stay mounted wherever the window is (see `pinnedItems`). */
  pinnedPaths: readonly string[];
}) {
  const [scrollMargin, setScrollMargin] = useState(0);
  const getItemKey = useCallback((index: number) => rows[index]?.node.path ?? index, [rows]);
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollElement ?? containerRef.current,
    estimateSize: () => ROW_MIN_HEIGHT_PX,
    getItemKey,
    overscan: VIRTUAL_OVERSCAN,
    scrollMargin,
  });

  // Content above the tree in a shared scroller can grow or shrink (a sibling section
  // collapsing), so the offset is re-read after every render but never mid-scroll: the two
  // rect reads would force layout on each tick, and the offset cannot change while scrolling
  // anyway (the tree's top moves up by exactly the scroll delta).
  useIsomorphicLayoutEffect(() => {
    const container = containerRef.current;
    // The scroller can go away while this stays mounted (a panel collapsing, a tab switching).
    // A margin left over from it would shift every measurement while the offset restarts at 0,
    // and the row transform and total size both subtract it, so only scrolling would look wrong.
    if (!container || !scrollElement) {
      if (scrollMargin !== 0) setScrollMargin(0);
      return;
    }
    if (virtualizer.isScrolling) return;
    const next = scrollMarginOf(container, scrollElement);
    if (next !== scrollMargin) setScrollMargin(next);
  });

  const isPinning = pinnedPaths.length > 0;
  // Built only while a row is pinned, so a scroll frame never scans every row to place it.
  const indexByPath = useMemo(() => {
    if (!isPinning) return undefined;
    const byPath = new Map<string, number>();
    rows.forEach((row, index) => byPath.set(row.node.path, index));
    return byPath;
  }, [isPinning, rows]);

  const items = virtualizer.getVirtualItems();
  // The window is one ascending, contiguous range, so "is this row already rendered" is a bounds
  // check rather than a lookup table rebuilt on every scroll frame. Empty window: nothing is in it.
  const firstWindowed = items[0]?.index ?? -1;
  const lastWindowed = items[items.length - 1]?.index ?? -2;

  // An open editor holds its draft in local state and commits on blur, but React dispatches no
  // focusout for a focused node that is removed, so unmounting the row being edited would throw
  // away what was typed. Keep those rows mounted even when the window has moved past them.
  const pinnedItems: VirtualItem[] = [];
  if (indexByPath) {
    for (const path of pinnedPaths) {
      const index = indexByPath.get(path);
      if (index === undefined || (index >= firstWindowed && index <= lastWindowed)) continue;
      // Measured offsets for every index, so a row outside the window still lands where it belongs.
      const measurement = virtualizer.measurementsCache[index];
      if (measurement) pinnedItems.push(measurement);
    }
  }

  // A pinned row lies outside the window, so it slots in before or after it and no sort is
  // needed. Order matters: appended last, it would tab and read out of sequence, and would move
  // in the DOM once the window reached it.
  const rendered =
    pinnedItems.length === 0
      ? items
      : [
          ...pinnedItems.filter((item) => item.index < firstWindowed),
          ...items,
          ...pinnedItems.filter((item) => item.index > lastWindowed),
        ];

  return (
    <div className="relative" style={{ height: virtualizer.getTotalSize() }}>
      {rendered.map((item) => {
        const row = rows[item.index];
        if (!row) return null;
        return (
          <div
            key={item.key}
            data-index={item.index}
            ref={virtualizer.measureElement}
            className="absolute top-0 left-0 w-full"
            style={{ transform: `translateY(${item.start - virtualizer.options.scrollMargin}px)` }}
          >
            <JsonTreeRow node={row.node} depth={row.depth} />
          </div>
        );
      })}
    </div>
  );
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
  virtualized = false,
  scrollElement,
  emptyMessage,
  className,
}: JsonTreeProps) {
  const { _ } = useSafeLingui();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const usesAncestorScroller = virtualized && !!scrollElement;
  const RowWrapper = rowWrapper ?? DefaultRowWrapper;
  const [editingPath, setEditingPath] = useState<string | null>(null);
  const [jsonEditingPath, setJsonEditingPath] = useState<string | null>(null);
  const [wrappedPaths, setWrappedPaths] = useState<Record<string, boolean>>({});
  // Unmounting a row mid-edit loses the draft, so a virtualized tree keeps these mounted.
  const pinnedPaths = useMemo(
    () => [
      ...new Set([editingPath, jsonEditingPath].filter((path): path is string => path !== null)),
    ],
    [editingPath, jsonEditingPath]
  );
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
          <div
            ref={containerRef}
            className={cn(
              // Scrolled by an ancestor: grow to content and scroll nothing here. `clip`, not
              // `hidden`: per CSS Overflow 3, `hidden` on one axis makes a `visible` other axis
              // compute to `auto`, which would silently make this a scroll container again.
              usesAncestorScroller ? 'overflow-x-clip' : 'h-full overflow-y-auto overflow-x-hidden',
              // Nothing taller than the viewport is on screen at once, and an unbounded scroll box
              // would put every row "in view" and mount all of them.
              virtualized && !usesAncestorScroller && 'max-h-screen',
              // Rows mounting and unmounting as the window moves would otherwise read as content shifting.
              virtualized && '[overflow-anchor:none]',
              className
            )}
          >
            {virtualized ? (
              <VirtualRows
                rows={rows}
                containerRef={containerRef}
                scrollElement={scrollElement}
                pinnedPaths={pinnedPaths}
              />
            ) : (
              rows.map(({ node, depth }) => (
                <JsonTreeRow key={node.path} node={node} depth={depth} />
              ))
            )}
            {rows.length === 0 && (
              <span className="p-4 text-center text-xs text-foreground-subtle">
                {resolvedEmptyMessage}
              </span>
            )}
          </div>
        </JsonTreeRowContextProvider>
      </CanvasTooltipProviderMarker>
    </TooltipProvider>
  );
}
