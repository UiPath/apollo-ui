import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  cn,
} from '@uipath/apollo-wind';
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  type LucideIcon,
  MousePointerClick,
  Pencil,
  Plus,
  SquareStack,
  Trash2,
  Variable,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSafeLingui } from '../../../i18n';
import { CanvasTooltip } from '../CanvasTooltip';
import {
  buildJsonTree,
  collectContainerPaths,
  flattenJsonTree,
  isArrayItemTemplateRoot,
  isPathCollapsed,
  type JsonObject,
  type JsonSchema,
  type JsonTreeFilterOption,
  type JsonTreeNode,
  JsonTreeToolbar,
  JsonTreeView,
  type JsonValue,
  type NodeAction,
  type NodeActionsResolver,
  type NodeDecoration,
  type PathForCopy,
  type PathSegment,
  schemaDisplayType,
} from '../JsonTree';
import { NodeVariableEditDialog } from './NodeVariableEditDialog';
import type {
  NodeVariableDetails,
  NodeVariablesAddableSection,
  NodeVariablesPanelProps,
  NodeVariablesSection,
  NodeVariablesSource,
  NodeVariableType,
} from './NodeVariablesPanel.types';

const SECTIONS: readonly NodeVariablesSection[] = ['inputs', 'outputs', 'variables', 'nodes'];

/** Sections whose rows are nodes (an id, a label, an icon, and outputs). */
type SourceSection = Extract<NodeVariablesSection, 'inputs' | 'nodes'>;
const isSourceSection = (section: NodeVariablesSection): section is SourceSection =>
  section === 'inputs' || section === 'nodes';

// One icon set at one size, each section in its own color.
const SECTION_ICONS: Record<NodeVariablesSection, { Icon: LucideIcon; className: string }> = {
  inputs: { Icon: ArrowDown, className: 'text-info' },
  outputs: { Icon: ArrowUp, className: 'text-success' },
  variables: { Icon: Variable, className: 'text-chart-purple' },
  nodes: { Icon: SquareStack, className: 'text-chart-pink' },
};

const SELECTED_NODE_FILTER_ID = 'selected-node';
const COUNT_CLASS = 'ml-auto shrink-0 font-mono text-[10px] text-foreground-muted';
const EMPTY_MESSAGE_CLASS = 'px-3 py-6 text-center text-xs text-foreground-muted';

/**
 * Real entries among sibling nodes. The tree adds a preview item to schema-only
 * or empty arrays; it isn't a real element, so it isn't counted.
 */
const countEntries = (nodes: JsonTreeNode[] | undefined) =>
  nodes?.filter((node) => !isArrayItemTemplateRoot(node)).length ?? 0;

/**
 * Object containers, including those nested in other objects. Arrays (and
 * anything inside them) are left out. Walks with an explicit stack, without
 * recursion or argument spreading, so very wide trees (large run outputs)
 * can't overflow the call stack.
 */
/** Above this many nodes a section windows its rows against the panel scroller. */
const VIRTUALIZE_THRESHOLD = 500;

/** Counts nodes (stack walk, like objectPaths), stopping once past the threshold. */
function exceedsVirtualizeThreshold(nodes: JsonTreeNode[]): boolean {
  let count = 0;
  const stack: JsonTreeNode[] = [...nodes.slice(0, VIRTUALIZE_THRESHOLD + 1)];
  while (stack.length > 0) {
    const node = stack.pop()!;
    count += 1;
    if (count > VIRTUALIZE_THRESHOLD) return true;
    for (const child of node.children ?? []) {
      stack.push(child);
      if (stack.length + count > VIRTUALIZE_THRESHOLD) return true;
    }
  }
  return false;
}

function objectPaths(nodes: JsonTreeNode[]): string[] {
  const paths: string[] = [];
  const stack: JsonTreeNode[] = [];
  for (let index = nodes.length - 1; index >= 0; index -= 1) stack.push(nodes[index]!);
  while (stack.length > 0) {
    const node = stack.pop()!;
    // Items of a root array come back as top-level nodes; they're still inside an array.
    if (node.type !== 'object' || !node.children || typeof node.segments[0] === 'number') continue;
    paths.push(node.path);
    for (let index = node.children.length - 1; index >= 0; index -= 1) {
      stack.push(node.children[index]!);
    }
  }
  return paths;
}

/**
 * An empty value for a node with no data yet, so it reads as a row rather than
 * "unset": `{}` / `[]` for container schemas, and `null` only when there is no
 * schema type at all. A declared scalar (`string`, `number`, ...) gets none, so the
 * tree keeps its declared type instead of a value overriding it.
 */
function emptyValueFor(schema: JsonSchema | undefined): JsonValue | undefined {
  const type = schemaDisplayType(schema);
  if (type === 'object') return {};
  if (type === 'array') return [];
  return type === 'null' ? null : undefined;
}

/**
 * One tree per section of nodes: each node is a top-level row keyed by its id,
 * with its output beneath. The tree escapes ids that aren't identifiers, so
 * copied references still parse.
 */
function buildSourceTree(sources: NodeVariablesSource[]): JsonTreeNode[] {
  // Object.fromEntries defines own keys, so an id like `__proto__` stays a real
  // entry instead of hitting the prototype setter.
  const properties: Record<string, JsonSchema> = Object.fromEntries(
    sources.map((source) => [source.id, source.schema ?? {}])
  );
  const value: JsonObject = Object.fromEntries(
    sources.flatMap((source) => {
      const entry = source.value ?? emptyValueFor(source.schema);
      return entry === undefined ? [] : [[source.id, entry]];
    })
  );
  return buildJsonTree({ schema: { type: 'object', properties }, value });
}

/** Tracks whether content is hidden above or below a scroll container. */
function useScrollEdges() {
  const ref = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ top: false, bottom: false });

  const update = useCallback(() => {
    const element = ref.current;
    if (!element) return;
    const top = element.scrollTop > 0;
    const bottom = element.scrollTop + element.clientHeight < element.scrollHeight - 1;
    setEdges((current) =>
      current.top === top && current.bottom === bottom ? current : { top, bottom }
    );
  }, []);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    update();
    if (typeof ResizeObserver === 'undefined') return;
    // The scroller keeps a fixed height, so also watch one stable wrapper around
    // the content: it resizes whenever sections open, close, or remount (e.g.
    // after a search is cleared), which per-child observers would miss.
    const observer = new ResizeObserver(update);
    observer.observe(element);
    if (contentRef.current) observer.observe(contentRef.current);
    return () => observer.disconnect();
  }, [update]);

  return { ref, contentRef, edges, onScroll: update };
}

/** A variable's type, from its schema or else its value. Anything unknown edits as a string. */
function variableTypeOf(
  schema: JsonSchema | undefined,
  value: JsonValue | undefined
): NodeVariableType {
  const declared = schemaDisplayType(schema);
  const type =
    declared && declared !== 'null'
      ? declared
      : Array.isArray(value)
        ? 'array'
        : value === null
          ? 'string'
          : typeof value;
  return type === 'number' || type === 'boolean' || type === 'object' || type === 'array'
    ? type
    : 'string';
}

/**
 * NodeVariablesPanel lists everything a node can reference while it is being
 * configured: the outputs of its upstream inputs, the flow's outputs and
 * shared variables, and every node in the flow.
 *
 * Each section is a `JsonTreeView` and the toolbar is `JsonTreeToolbar`, so
 * rows, search, copying, and reference paths behave as in `NodeIOView`. Data
 * follows the same contract (`schema` and/or `value`). Every reference starts
 * at `$vars.` (see `referencePrefix`). Node rows show the node's name and icon,
 * with its id on hover, an output count, a "Focus on node" action, and an add
 * action. Top-level variables open an Edit variable dialog and can be deleted.
 *
 * The component is the body of a panel tab: compose it inside
 * `NodePropertyPanel`, which owns the chrome.
 *
 * @example
 * ```tsx
 * <NodePropertyPanel panelTitle="Properties" onClose={close}>
 *   <Tabs defaultValue="variables">
 *     <TabsContent value="variables">
 *       <NodeVariablesPanel
 *         inputs={[{ id: 'httpWebhook1', label: 'HTTP webhook', schema: webhookOutputSchema }]}
 *         variables={{ value: flowVariables }}
 *         nodes={flowNodes}
 *         selectedNodeId={selection}
 *         onFocusNode={focusNode}
 *         onAdd={(section) => openAddDialog(section)}
 *       />
 *     </TabsContent>
 *   </Tabs>
 * </NodePropertyPanel>
 * ```
 */
export function NodeVariablesPanel({
  inputs = [],
  outputs,
  variables,
  nodes = [],
  outputsBasePath,
  variablesBasePath,
  referencePrefix = '$vars',
  pathForCopy,
  defaultExpandedSections = ['nodes'],
  selectedNodeId,
  onFocusNode,
  onAdd,
  onEditVariable,
  onDeleteVariable,
  onCopy,
  leading,
  className,
}: NodeVariablesPanelProps) {
  const { _ } = useSafeLingui();

  const trees = useMemo<Record<NodeVariablesSection, JsonTreeNode[]>>(
    () => ({
      inputs: buildSourceTree(inputs),
      outputs: buildJsonTree({
        schema: outputs?.schema,
        value: outputs?.value,
        basePath: outputsBasePath,
      }),
      variables: buildJsonTree({
        schema: variables?.schema,
        value: variables?.value,
        basePath: variablesBasePath,
      }),
      nodes: buildSourceTree(nodes),
    }),
    [inputs, outputs, outputsBasePath, variables, variablesBasePath, nodes]
  );
  // One lookup per section: an upstream input also appears in Nodes, and each
  // list's own metadata (label, icon, output count) must win in its section.
  const sourcesById = useMemo<Record<SourceSection, Map<string, NodeVariablesSource>>>(
    () => ({
      inputs: new Map(inputs.map((source) => [source.id, source])),
      nodes: new Map(nodes.map((source) => [source.id, source])),
    }),
    [inputs, nodes]
  );

  const [openSections, setOpenSections] = useState(
    () => new Set<NodeVariablesSection>(defaultExpandedSections)
  );
  // Containers start collapsed. Tracking the opened paths (rather than the
  // collapsed ones) keeps containers that appear later, such as a renamed
  // object variable, collapsed by default too. Kept per section: each section is
  // its own tree, and the same path can appear in two (a node in Inputs and Nodes).
  const [openPaths, setOpenPaths] = useState<Record<NodeVariablesSection, Record<string, boolean>>>(
    { inputs: {}, outputs: {}, variables: {}, nodes: {} }
  );
  // The tree's shape: every container path, true when collapsed. Own entries for
  // every path, read with own-key checks, so a key named after an
  // Object.prototype member (`constructor`) expands like any other.
  const collapsed = useMemo(
    () =>
      Object.fromEntries(
        SECTIONS.map((section) => [
          section,
          Object.fromEntries(
            collectContainerPaths(trees[section]).map(({ path }) => [
              path,
              // Open paths use the same own-key read as collapsed ones.
              !isPathCollapsed(openPaths[section], path),
            ])
          ),
        ])
      ) as Record<NodeVariablesSection, Record<string, boolean>>,
    [trees, openPaths]
  );
  // Large sections (big run outputs) mount only the rows in view, windowed
  // against the panel's scroller; small ones render normally.
  const virtualize = useMemo(
    () =>
      Object.fromEntries(
        SECTIONS.map((section) => [section, exceedsVirtualizeThreshold(trees[section])])
      ) as Record<NodeVariablesSection, boolean>,
    [trees]
  );
  const [scroller, setScroller] = useState<HTMLDivElement | null>(null);
  const [query, setQuery] = useState('');
  const [activeFilterId, setActiveFilterId] = useState<string | null>(null);
  const [editing, setEditing] = useState<NodeVariableDetails | null>(null);

  // Every reference starts at the prefix: `$vars.httpWebhook1.output.body`, `$vars.flowTest`.
  // A bracket-quoted first segment (`["node-1"]`) attaches without a dot.
  const referenceFor = useCallback<PathForCopy>(
    (path: string, segments: PathSegment[]) => {
      const prefixed =
        referencePrefix && path
          ? `${referencePrefix}${path.startsWith('[') ? '' : '.'}${path}`
          : path || referencePrefix;
      return pathForCopy ? pathForCopy(prefixed, segments) : prefixed;
    },
    [referencePrefix, pathForCopy]
  );

  const search = query.trim();
  const nodeFilterActive = activeFilterId === SELECTED_NODE_FILTER_ID && !!selectedNodeId;
  const narrowing = !!search || nodeFilterActive;

  const filters = useMemo<JsonTreeFilterOption[] | undefined>(
    () =>
      selectedNodeId
        ? [
            {
              id: SELECTED_NODE_FILTER_ID,
              label: _({
                id: 'canvas.node_variables_panel.option_selected_node',
                message: 'Selected node',
              }),
              predicate: (node) => node.segments[0] === selectedNodeId,
            },
          ]
        : undefined,
    [selectedNodeId, _]
  );
  const filterPredicate = nodeFilterActive ? filters?.[0]?.predicate : undefined;

  // Node rows: the node's name and icon over its id, which stays the raw key so
  // paths, copying, and search still use it.
  // Stable per section, since the tree memoizes its rows on it.
  const decorateSource = useMemo(() => {
    const decorate =
      (section: SourceSection) =>
      (node: JsonTreeNode): NodeDecoration | undefined => {
        if (node.segments.length !== 1) return undefined;
        const source = sourcesById[section].get(String(node.segments[0]));
        if (!source) return undefined;
        const count = source.outputCount ?? countEntries(node.children);
        const countLabel = _({
          id: 'canvas.node_variables_panel.node_output_count',
          message: '{count, plural, one {# output} other {# outputs}}',
          values: { count },
        });
        return {
          label: source.label,
          // The id shows on hover; the name's tooltip has both in full.
          sublabel: source.id,
          sublabelOnHover: true,
          badge: { icon: source.icon },
          hideCount: true,
          // A node with no output yet is a null scalar; the row names the node,
          // so it shows no "= null".
          hideValue: true,
          // In the row's trailing cluster, between Focus and +, so it lines up
          // with the section header's count.
          meta: (
            <CanvasTooltip content={countLabel} placement="top" delay>
              <span role="img" aria-label={countLabel} className={COUNT_CLASS}>
                ({count})
              </span>
            </CanvasTooltip>
          ),
        };
      };
    return { inputs: decorate('inputs'), nodes: decorate('nodes') };
  }, [sourcesById, _]);

  const visibleRows = (section: NodeVariablesSection) => {
    // The selected-node filter narrows to node sections.
    if (nodeFilterActive && !isSourceSection(section)) return 0;
    return flattenJsonTree(trees[section], {
      collapsed: {},
      query: search,
      filterPredicate: isSourceSection(section) ? filterPredicate : undefined,
      displayTexts: isSourceSection(section) ? decorateSource[section] : undefined,
    }).length;
  };
  const visibleCount = Object.fromEntries(
    SECTIONS.map((section) => [section, narrowing ? visibleRows(section) : 1])
  ) as Record<NodeVariablesSection, number>;
  const totalCount: Record<NodeVariablesSection, number> = {
    inputs: inputs.length,
    outputs: countEntries(trees.outputs),
    variables: countEntries(trees.variables),
    nodes: nodes.length,
  };

  const sectionOpen = (section: NodeVariablesSection) => narrowing || openSections.has(section);
  const setSectionOpen = (section: NodeVariablesSection, open: boolean) =>
    setOpenSections((current) => {
      const next = new Set(current);
      if (open) next.add(section);
      else next.delete(section);
      return next;
    });
  const toggleCollapsed = (section: NodeVariablesSection) => (path: string) =>
    setOpenPaths((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [path]: isPathCollapsed(collapsed[section], path),
      },
    }));

  // "Expand all" opens every section with content and every object. Empty
  // sections and arrays (which can be long) stay as they are.
  const expandableSections = SECTIONS.filter((section) => totalCount[section] > 0);
  const expandablePaths = useMemo(
    () =>
      Object.fromEntries(
        SECTIONS.map((section) => [section, objectPaths(trees[section])])
      ) as Record<NodeVariablesSection, string[]>,
    [trees]
  );
  const allExpanded =
    expandableSections.length > 0 &&
    expandableSections.every((section) => openSections.has(section)) &&
    SECTIONS.every((section) =>
      expandablePaths[section].every((path) => !isPathCollapsed(collapsed[section], path))
    );
  const toggleAll = () => {
    const open = !allExpanded;
    setOpenSections(open ? new Set(expandableSections) : new Set());
    setOpenPaths(
      (current) =>
        Object.fromEntries(
          SECTIONS.map((section) => [
            section,
            {
              ...current[section],
              ...Object.fromEntries(expandablePaths[section].map((path) => [path, open])),
            },
          ])
        ) as Record<NodeVariablesSection, Record<string, boolean>>
    );
  };

  const sourceActions =
    (section: SourceSection): NodeActionsResolver =>
    (node, ctx) => {
      if (node.segments.length !== 1) return ctx.defaultActions;
      const source = sourcesById[section].get(String(node.segments[0]));
      const label = source?.label ?? node.key;
      const actions: NodeAction[] = [];
      if (onAdd) {
        actions.push({
          id: 'add-to-node',
          icon: <Plus />,
          label: _({
            id: 'canvas.node_variables_panel.add_to_node_label',
            message: 'Add from {label}',
            values: { label },
          }),
          tooltip: _({ id: 'canvas.node_variables_panel.add_to_node', message: 'Add' }),
          // Always shown, after the count, like the section header's +.
          persistent: true,
          onSelect: () => onAdd(section, node.key),
        });
      }
      if (onFocusNode) {
        actions.unshift({
          id: 'focus-node',
          icon: <MousePointerClick />,
          label: _({
            id: 'canvas.node_variables_panel.focus_node_label',
            message: 'Focus on {label}',
            values: { label },
          }),
          tooltip: _({ id: 'canvas.node_variables_panel.focus_node', message: 'Focus on node' }),
          // Always shown, before the count.
          persistent: true,
          placement: 'start',
          onSelect: () => onFocusNode(node.key),
        });
      }
      return actions;
    };

  const variableActions: NodeActionsResolver = (node, ctx) => {
    // A variable is a named top-level key. Items of an array root (or its preview) aren't.
    if (node.segments.length !== 1 || typeof node.segments[0] !== 'string') {
      return ctx.defaultActions;
    }
    const actions: NodeAction[] = [...ctx.defaultActions];
    if (onEditVariable) {
      actions.push({
        id: 'edit-variable',
        icon: <Pencil />,
        label: _({
          id: 'canvas.node_variables_panel.edit_variable',
          message: 'Edit {name}',
          values: { name: node.key },
        }),
        onSelect: () => {
          // Own keys only: a variable named `constructor` that the value omits must
          // not read the inherited Object function as its default.
          const properties = variables?.schema?.properties;
          const schema =
            properties && Object.hasOwn(properties, node.key) ? properties[node.key] : undefined;
          const value =
            variables?.value && Object.hasOwn(variables.value, node.key)
              ? variables.value[node.key]
              : undefined;
          setEditing({
            id: node.key,
            type: variableTypeOf(schema, value),
            description: schema?.description,
            // An explicit `null` default is a real default, so check for the key.
            defaultValue: schema && Object.hasOwn(schema, 'default') ? schema.default : value,
          });
        },
      });
    }
    if (onDeleteVariable) {
      actions.push({
        id: 'delete-variable',
        icon: <Trash2 />,
        label: _({
          id: 'canvas.node_variables_panel.delete_variable',
          message: 'Delete {name}',
          values: { name: node.key },
        }),
        tone: 'error',
        onSelect: () => onDeleteVariable(node.key),
      });
    }
    return actions;
  };

  const variableNames = useMemo(
    // Both sources: a schema can declare a variable the value doesn't set yet.
    () =>
      new Set([
        ...Object.keys(variables?.value ?? {}),
        ...Object.keys(variables?.schema?.properties ?? {}),
      ]),
    [variables]
  );

  const sectionName: Record<NodeVariablesSection, string> = {
    inputs: _({ id: 'canvas.node_variables_panel.section_inputs', message: 'Inputs' }),
    outputs: _({ id: 'canvas.node_variables_panel.section_outputs', message: 'Outputs' }),
    variables: _({ id: 'canvas.node_variables_panel.section_variables', message: 'Variables' }),
    nodes: _({ id: 'canvas.node_variables_panel.section_nodes', message: 'Nodes' }),
  };
  const sectionCountLabel = (section: NodeVariablesSection, count: number) =>
    ({
      inputs: _({
        id: 'canvas.node_variables_panel.count_inputs',
        message: '{count, plural, one {# input} other {# inputs}}',
        values: { count },
      }),
      outputs: _({
        id: 'canvas.node_variables_panel.count_outputs',
        message: '{count, plural, one {# output} other {# outputs}}',
        values: { count },
      }),
      variables: _({
        id: 'canvas.node_variables_panel.count_variables',
        message: '{count, plural, one {# variable} other {# variables}}',
        values: { count },
      }),
      nodes: _({
        id: 'canvas.node_variables_panel.count_nodes',
        message: '{count, plural, one {# node} other {# nodes}}',
        values: { count },
      }),
    })[section];
  const addLabel = (section: NodeVariablesAddableSection) =>
    ({
      outputs: _({ id: 'canvas.node_variables_panel.add_outputs', message: 'Add outputs' }),
      variables: _({ id: 'canvas.node_variables_panel.add_variables', message: 'Add variables' }),
    })[section];

  const renderTree = (section: NodeVariablesSection) => (
    <JsonTreeView
      nodes={trees[section]}
      // While searching, every match is shown open.
      collapsed={search ? {} : collapsed[section]}
      // Search holds every match open, so the chevrons would change nothing visible.
      onToggleCollapsed={search ? undefined : toggleCollapsed(section)}
      query={search}
      filterPredicate={isSourceSection(section) ? filterPredicate : undefined}
      readOnly
      decorateNode={isSourceSection(section) ? decorateSource[section] : undefined}
      nodeActions={
        isSourceSection(section)
          ? sourceActions(section)
          : section === 'variables'
            ? variableActions
            : undefined
      }
      maxInlineActions={section === 'variables' ? 4 : undefined}
      pathForCopy={referenceFor}
      onCopy={onCopy}
      virtualized={virtualize[section]}
      scrollElement={virtualize[section] ? scroller : undefined}
      className="h-auto py-1"
    />
  );

  const renderSection = (section: NodeVariablesSection) => {
    if (narrowing && visibleCount[section] === 0) return null;
    const open = sectionOpen(section);
    const name = sectionName[section];
    const count = totalCount[section];
    const { Icon, className: iconClassName } = SECTION_ICONS[section];
    // Inputs and Nodes add per node row instead (see sourceActions).
    const addable = (section === 'outputs' || section === 'variables') && onAdd ? section : null;

    return (
      <Collapsible
        key={section}
        open={open}
        onOpenChange={(next) => setSectionOpen(section, next)}
        disabled={narrowing}
        asChild
      >
        <section
          aria-label={name}
          className="mb-2 overflow-hidden rounded-lg border border-surface-overlay bg-surface-overlay/40"
        >
          {/* 8px left puts the chevron in line with the row chevrons below; 4px right
              matches the rows, so the header's count and + share their columns. The
              divider shows only over content: on a collapsed card it would sit on the
              card's bottom border and double it. */}
          <div
            className={cn(
              'flex h-9 items-center gap-2 pr-1 pl-2',
              open && trees[section].length > 0 && 'border-b border-surface-overlay/80'
            )}
          >
            <CollapsibleTrigger className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left disabled:cursor-default">
              <ChevronDown
                size={10}
                className={cn(
                  'shrink-0 text-foreground-subtle transition-transform',
                  !open && '-rotate-90'
                )}
              />
              <span
                className={cn('grid size-4.5 shrink-0 place-items-center', iconClassName)}
                aria-hidden="true"
              >
                <Icon size={14} />
              </span>
              <span className="truncate text-xs font-semibold tracking-[0.02em] text-foreground">
                {name}
              </span>
            </CollapsibleTrigger>
            <CanvasTooltip content={sectionCountLabel(section, count)} placement="top" delay>
              <span
                role="img"
                aria-label={sectionCountLabel(section, count)}
                // Offsets the + slot's -2px, so the count lines up with node-row counts.
                className={COUNT_CLASS}
              >
                ({count})
              </span>
            </CanvasTooltip>
            {addable && (
              // The same button as the tree's row actions, so header and row + match.
              <Button
                variant="ghost"
                size="4xs"
                icon
                aria-label={addLabel(addable)}
                onClick={() => onAdd?.(addable)}
                className="shrink-0 rounded text-foreground-subtle hover:bg-surface-raised hover:text-foreground [&_svg]:size-2.75"
              >
                <Plus />
              </Button>
            )}
            {/* Inputs and Nodes add per row; keep the slot so every card's count lines up. */}
            {onAdd && !addable && <span aria-hidden="true" className="size-5 shrink-0" />}
          </div>
          {/* Always mounted, so the trigger's aria-controls names a real element. */}
          <CollapsibleContent className="bg-surface/30">
            {/* Rows, not real entries: a schema-only array still shows its item shape. */}
            {trees[section].length > 0 && renderTree(section)}
          </CollapsibleContent>
        </section>
      </Collapsible>
    );
  };

  const { ref: scrollRef, contentRef, edges, onScroll } = useScrollEdges();
  // A callback ref, so virtualized sections get the scroller once it mounts.
  const setScrollRef = useCallback(
    (element: HTMLDivElement | null) => {
      scrollRef.current = element;
      setScroller(element);
    },
    [scrollRef]
  );
  const nothingVisible = narrowing && SECTIONS.every((section) => visibleCount[section] === 0);

  return (
    <div className={cn('flex min-h-0 flex-1 flex-col', className)}>
      <JsonTreeToolbar
        query={query}
        onQueryChange={setQuery}
        searchPlaceholder={_({
          id: 'canvas.node_variables_panel.search_placeholder',
          message: 'Search variables',
        })}
        filters={filters}
        activeFilterId={activeFilterId}
        onFilterChange={setActiveFilterId}
        allCollapsed={!allExpanded}
        // Search holds every match open, so expand/collapse all would have no
        // visible effect; hide it until the search is cleared. The node filter only
        // opens sections, so expand/collapse all still applies to their containers.
        onToggleAll={search ? undefined : toggleAll}
        leading={leading}
        className="shrink-0 pt-4 pb-2 [padding-inline:var(--mf-content-inset,1rem)]"
      />
      <div className="min-h-0 flex-1 overflow-hidden text-foreground">
        <div className="relative mt-1 mb-4 h-[calc(100%-1.25rem)] min-h-0 [margin-inline:var(--mf-content-inset,1rem)]">
          {/* 1px edges appear only while content is scrolled past them. A rounded
              top/bottom border alone tapers into the corner, matching the cards'
              radius without doubling their side borders. Drawn as overlays so
              they don't depend on border-color utility ordering. */}
          {edges.top && (
            <div
              aria-hidden="true"
              data-edge="top"
              className="pointer-events-none absolute inset-x-0 top-0 z-10 h-2 rounded-t-lg border-t border-surface-overlay"
            />
          )}
          {edges.bottom && (
            <div
              aria-hidden="true"
              data-edge="bottom"
              className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-2 rounded-b-lg border-b border-surface-overlay"
            />
          )}
          <div
            ref={setScrollRef}
            onScroll={onScroll}
            className="h-full min-h-0 overflow-y-auto rounded-lg pb-1"
          >
            <div ref={contentRef}>
              {SECTIONS.map(renderSection)}
              {nothingVisible && (
                <p className={EMPTY_MESSAGE_CLASS}>
                  {search
                    ? _({
                        id: 'canvas.node_variables_panel.no_matches',
                        message: 'No variables match your search.',
                      })
                    : _({
                        id: 'canvas.node_variables_panel.selected_node_empty',
                        message: 'The selected node has no variables.',
                      })}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      {editing && onEditVariable && (
        <NodeVariableEditDialog
          key={editing.id}
          variable={editing}
          takenNames={variableNames}
          referenceFor={(id) =>
            referenceFor(variablesBasePath ? `${variablesBasePath}.${id}` : id, [id])
          }
          onSave={(next) => {
            onEditVariable(editing.id, next);
            setEditing(null);
          }}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
