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
  MousePointerClick,
  Pencil,
  Plus,
  SquareStack,
  Trash2,
  Variable,
} from 'lucide-react';
import { type ComponentType, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSafeLingui } from '../../../i18n';
import { Asset } from '../../../icons';
import { CanvasTooltip } from '../CanvasTooltip';
import {
  appendPathSegment,
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
  NodeVariablesRow,
  NodeVariablesSection,
  NodeVariablesSource,
  NodeVariableType,
} from './NodeVariablesPanel.types';

const SECTIONS: readonly NodeVariablesSection[] = [
  'inputs',
  'outputs',
  'variables',
  'assets',
  'nodes',
];

/** Sections whose rows are nodes (an id, a label, an icon, and outputs). */
type SourceSection = Extract<NodeVariablesSection, 'inputs' | 'nodes'>;
const isSourceSection = (section: NodeVariablesSection): section is SourceSection =>
  section === 'inputs' || section === 'nodes';

// One icon set at one size, each section in its own color.
const SECTION_ICONS: Record<
  NodeVariablesSection,
  { Icon: ComponentType<{ size?: number | string }>; className: string }
> = {
  inputs: { Icon: ArrowDown, className: 'text-info' },
  outputs: { Icon: ArrowUp, className: 'text-success' },
  variables: { Icon: Variable, className: 'text-chart-purple' },
  assets: { Icon: Asset, className: 'text-chart-yellow/60' },
  nodes: { Icon: SquareStack, className: 'text-chart-pink' },
};

const COUNT_CLASS = 'ml-auto shrink-0 font-mono text-[10px] text-foreground-muted';
const EMPTY_MESSAGE_CLASS = 'px-3 py-6 text-center text-xs text-foreground-muted';

/**
 * Real entries among sibling nodes. The tree adds a preview item to schema-only
 * or empty arrays; it isn't a real element, so it isn't counted.
 */
const countEntries = (nodes: JsonTreeNode[] | undefined) =>
  nodes?.filter((node) => !isArrayItemTemplateRoot(node)).length ?? 0;

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

/**
 * Object containers, including those nested in other objects. Arrays (and
 * anything inside them) are left out. Walks with an explicit stack, without
 * recursion or argument spreading, so very wide trees (large run outputs)
 * can't overflow the call stack.
 */
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

/** The row a tree node is, as filters and the variable callbacks see it. */
function rowFor(section: NodeVariablesSection, node: JsonTreeNode): NodeVariablesRow {
  return isSourceSection(section)
    ? { section, nodeId: String(node.segments[0]), node }
    : { section, node };
}

/** Top-level named keys in Assets: one row per declared asset. */
const isTopLevelAsset = ({ section, node }: NodeVariablesRow) =>
  section === 'assets' && node.segments.length === 1 && typeof node.segments[0] === 'string';

/** Default `isVariableRow`: top-level named keys in Outputs and Variables. */
const isTopLevelVariable = ({ section, node }: NodeVariablesRow) =>
  (section === 'outputs' || section === 'variables') &&
  node.segments.length === 1 &&
  typeof node.segments[0] === 'string';

/**
 * Keys of a node and its siblings, which a rename can't take. Matched by path,
 * since the tree may be rebuilt while the dialog is open. Stack walk, like objectPaths.
 */
function siblingKeys(tree: JsonTreeNode[], targetPath: string): Set<string> {
  const keysOf = (nodes: JsonTreeNode[]) => new Set(nodes.map((node) => node.key));
  if (tree.some((node) => node.path === targetPath)) return keysOf(tree);
  const stack = [...tree];
  while (stack.length > 0) {
    const node = stack.pop()!;
    if (!node.children) continue;
    if (node.children.some((child) => child.path === targetPath)) return keysOf(node.children);
    for (const child of node.children) stack.push(child);
  }
  return new Set();
}

/** A variable open in the Edit variable dialog. */
interface EditingVariable {
  row: NodeVariablesRow;
  details: NodeVariableDetails;
}

/**
 * NodeVariablesPanel lists everything a node can reference while it is being
 * configured: the outputs of its upstream inputs, the flow's outputs and
 * shared variables, its declared assets, and every node in the flow.
 *
 * Each section is a `JsonTreeView` and the toolbar is `JsonTreeToolbar`, so
 * rows, search, copying, and reference paths behave as in `NodeIOView`. Data
 * follows the same contract (`schema` and/or `value`). Every reference starts
 * at `$vars.` (see `referencePrefix`), except assets, which start at `$assets.`
 * (see `assetsReferencePrefix`). Node rows show the node's name and icon,
 * with its id on hover, an output count, a "Focus on node" action, and an add
 * action. Variable rows (`isVariableRow`, by default top-level Outputs and
 * Variables) can be edited, in the built-in dialog or the host's own
 * (`onRequestEditVariable`), and deleted. Asset rows share those two callbacks
 * (the row's `section` tells them apart) but never open the built-in dialog,
 * so a host can keep the dialog for variables and edit assets in its own.
 * Filters come from the host.
 *
 * The component is the body of a panel tab: compose it inside
 * `NodePropertyPanel`, which owns the chrome.
 *
 * @example
 * ```tsx
 * const tabs = (
 *   <PanelTabsStrip>
 *     <PanelTabsTrigger value="properties">Properties</PanelTabsTrigger>
 *     <PanelTabsTrigger value="variables">Variables</PanelTabsTrigger>
 *   </PanelTabsStrip>
 * );
 *
 * <NodePropertyPanel panelTitle="Properties" onClose={close}>
 *   <PanelTabs defaultValue="variables" className="h-full">
 *     <PanelTabsContent value="variables" padded={false} className="flex-col data-[state=active]:flex">
 *       <NodeVariablesPanel
 *         // The tabs share the panel's toolbar row.
 *         leading={tabs}
 *         inputs={[{ id: 'httpWebhook1', label: 'HTTP webhook', schema: webhookOutputSchema }]}
 *         variables={{ value: flowVariables }}
 *         nodes={flowNodes}
 *         filters={[
 *           { id: 'upstream', label: 'Upstream', predicate: ({ nodeId }) => !nodeId || inScope.has(nodeId) },
 *         ]}
 *         onFocusNode={focusNode}
 *         onAdd={(section, nodeId) => openAddDialog(section, nodeId)}
 *         onEditVariable={(row, next) => saveVariable(row.node.key, next)}
 *       />
 *     </PanelTabsContent>
 *   </PanelTabs>
 * </NodePropertyPanel>
 * ```
 */
export function NodeVariablesPanel({
  inputs = [],
  outputs,
  variables,
  assets,
  nodes = [],
  outputsBasePath,
  variablesBasePath,
  assetsBasePath,
  referencePrefix = '$vars',
  assetsReferencePrefix = '$assets',
  pathForCopy,
  defaultExpandedSections = ['nodes'],
  filters,
  activeFilterId: activeFilterIdProp,
  defaultActiveFilterId = null,
  onActiveFilterChange,
  onFocusNode,
  onAdd,
  isVariableRow = isTopLevelVariable,
  onEditVariable,
  onRequestEditVariable,
  onDeleteVariable,
  onCopy,
  leading,
  rowWrapper,
  deriveTypeIcon,
  children,
  className,
}: NodeVariablesPanelProps) {
  const { _ } = useSafeLingui();

  // One entry per section whose paths can be prefixed, so a new variable type is one more line.
  const basePaths = useMemo(
    () =>
      new Map<NodeVariablesSection, string | undefined>([
        ['outputs', outputsBasePath],
        ['variables', variablesBasePath],
        ['assets', assetsBasePath],
      ]),
    [outputsBasePath, variablesBasePath, assetsBasePath]
  );

  const trees = useMemo<Record<NodeVariablesSection, JsonTreeNode[]>>(
    () => ({
      inputs: buildSourceTree(inputs),
      outputs: buildJsonTree({
        schema: outputs?.schema,
        value: outputs?.value,
        basePath: basePaths.get('outputs'),
      }),
      variables: buildJsonTree({
        schema: variables?.schema,
        value: variables?.value,
        basePath: basePaths.get('variables'),
      }),
      assets: buildJsonTree({
        schema: assets?.schema,
        value: assets?.value,
        basePath: basePaths.get('assets'),
      }),
      nodes: buildSourceTree(nodes),
    }),
    [inputs, outputs, variables, assets, nodes, basePaths]
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
    { inputs: {}, outputs: {}, variables: {}, assets: {}, nodes: {} }
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
  const [uncontrolledFilterId, setUncontrolledFilterId] = useState(defaultActiveFilterId);
  const activeFilterId =
    activeFilterIdProp !== undefined ? activeFilterIdProp : uncontrolledFilterId;
  const changeFilter = (id: string | null) => {
    if (activeFilterIdProp === undefined) setUncontrolledFilterId(id);
    onActiveFilterChange?.(id);
  };
  const [editing, setEditing] = useState<EditingVariable | null>(null);

  // Every reference starts at its section's prefix: `$vars.httpWebhook1.output.body`,
  // `$vars.flowTest`, `$assets.apiKey`. A bracket-quoted first segment (`["node-1"]`)
  // attaches without a dot.
  const referenceFor = useCallback(
    (section: NodeVariablesSection): PathForCopy =>
      (path: string, segments: PathSegment[]) => {
        const prefix = section === 'assets' ? assetsReferencePrefix : referencePrefix;
        const prefixed =
          prefix && path ? `${prefix}${path.startsWith('[') ? '' : '.'}${path}` : path || prefix;
        return pathForCopy ? pathForCopy(prefixed, segments) : prefixed;
      },
    [referencePrefix, assetsReferencePrefix, pathForCopy]
  );

  const search = query.trim();
  const activeFilter = filters?.find((filter) => filter.id === activeFilterId);
  const narrowing = !!search || !!activeFilter;

  // The toolbar only lists the options; matching runs per section below.
  const toolbarFilters = useMemo<JsonTreeFilterOption[] | undefined>(
    () => filters?.map(({ id, label }) => ({ id, label, predicate: () => true })),
    [filters]
  );
  // The active filter as each section's tree predicate, with the row it sees.
  const filterPredicates = useMemo(
    () =>
      activeFilter
        ? (Object.fromEntries(
            SECTIONS.map((section) => [
              section,
              (node: JsonTreeNode) => activeFilter.predicate(rowFor(section, node)),
            ])
          ) as Record<NodeVariablesSection, (node: JsonTreeNode) => boolean>)
        : undefined,
    [activeFilter]
  );

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

  // Rows each section shows while narrowed; a section with none is hidden.
  // Memoized, so a keystroke flattens each tree once here, not on every render.
  const visibleCount = useMemo(
    () =>
      Object.fromEntries(
        SECTIONS.map((section) => [
          section,
          narrowing
            ? flattenJsonTree(trees[section], {
                collapsed: {},
                query: search,
                filterPredicate: filterPredicates?.[section],
                displayTexts: isSourceSection(section) ? decorateSource[section] : undefined,
              }).length
            : 1,
        ])
      ) as Record<NodeVariablesSection, number>,
    [narrowing, trees, search, filterPredicates, decorateSource]
  );
  const totalCount: Record<NodeVariablesSection, number> = {
    inputs: inputs.length,
    outputs: countEntries(trees.outputs),
    variables: countEntries(trees.variables),
    assets: countEntries(trees.assets),
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
      if (onAdd && source?.addable !== false) {
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

  const openEditDialog = (row: NodeVariablesRow) => {
    const { schema, value } = row.node;
    setEditing({
      row,
      details: {
        id: row.node.key,
        type: variableTypeOf(schema, value),
        description: schema?.description,
        // An explicit `null` default is a real default, so check for the key.
        defaultValue: schema && Object.hasOwn(schema, 'default') ? schema.default : value,
      },
    });
  };

  // Variable and asset rows add edit and delete to the tree's own actions.
  const variableActions = (row: NodeVariablesRow, ctx: { defaultActions: NodeAction[] }) => {
    const { node } = row;
    const actions: NodeAction[] = [...ctx.defaultActions];
    // The built-in dialog edits a variable's type and default, which assets don't have:
    // when onEditVariable is set it takes variable rows, and onRequestEditVariable the rest.
    const builtIn = Boolean(onEditVariable) && row.section !== 'assets';
    if (builtIn || onRequestEditVariable) {
      actions.push({
        id: 'edit-variable',
        icon: <Pencil />,
        label: _({
          id: 'canvas.node_variables_panel.edit_variable',
          message: 'Edit {name}',
          values: { name: node.key },
        }),
        onSelect: () => (builtIn ? openEditDialog(row) : onRequestEditVariable?.(row)),
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
        onSelect: () => onDeleteVariable(row),
      });
    }
    return actions;
  };

  const actionsFor =
    (section: NodeVariablesSection): NodeActionsResolver =>
    (node, ctx) => {
      if (isSourceSection(section) && node.segments.length === 1) {
        return sourceActions(section)(node, ctx);
      }
      const row = rowFor(section, node);
      // Array preview rows stand for an item shape, never a variable or an asset.
      if (node.isArrayItemTemplate) return ctx.defaultActions;
      // Assets are host-managed: a custom isVariableRow never reaches them, nested fields included.
      if (section === 'assets')
        return isTopLevelAsset(row) ? variableActions(row, ctx) : ctx.defaultActions;
      return isVariableRow(row) ? variableActions(row, ctx) : ctx.defaultActions;
    };

  /** Where a renamed variable would be referenced, shown in the dialog. */
  const renamedReference =
    ({ section, node }: NodeVariablesRow) =>
    (id: string) => {
      const basePath = basePaths.get(section) ?? '';
      const parentSegments = node.segments.slice(0, -1);
      const path = [...parentSegments, id].reduce<string>(appendPathSegment, basePath);
      return referenceFor(section)(path, [...parentSegments, id]);
    };

  const sectionName: Record<NodeVariablesSection, string> = {
    inputs: _({ id: 'canvas.node_variables_panel.section_inputs', message: 'Inputs' }),
    outputs: _({ id: 'canvas.node_variables_panel.section_outputs', message: 'Outputs' }),
    variables: _({ id: 'canvas.node_variables_panel.section_variables', message: 'Variables' }),
    assets: _({ id: 'canvas.node_variables_panel.section_assets', message: 'Assets' }),
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
      assets: _({
        id: 'canvas.node_variables_panel.count_assets',
        message: '{count, plural, one {# asset} other {# assets}}',
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
      assets: _({ id: 'canvas.node_variables_panel.add_assets', message: 'Add asset' }),
    })[section];

  const renderTree = (section: NodeVariablesSection) => (
    <JsonTreeView
      nodes={trees[section]}
      // While searching, every match is shown open.
      collapsed={search ? {} : collapsed[section]}
      // Search holds every match open, so the chevrons would change nothing visible.
      onToggleCollapsed={search ? undefined : toggleCollapsed(section)}
      query={search}
      filterPredicate={filterPredicates?.[section]}
      readOnly
      decorateNode={isSourceSection(section) ? decorateSource[section] : undefined}
      deriveTypeIcon={deriveTypeIcon}
      rowWrapper={rowWrapper}
      nodeActions={actionsFor(section)}
      // Room for copy plus edit and delete on variable rows.
      maxInlineActions={4}
      pathForCopy={referenceFor(section)}
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
    const addable =
      (section === 'outputs' || section === 'variables' || section === 'assets') && onAdd
        ? section
        : null;

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
        filters={toolbarFilters}
        activeFilterId={activeFilter ? activeFilterId : null}
        onFilterChange={changeFilter}
        allCollapsed={!allExpanded}
        // Search holds every match open, so expand/collapse all would have no
        // visible effect; hide it until the search is cleared. A filter only opens
        // sections, so expand/collapse all still applies to their containers.
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
                    : (activeFilter?.emptyMessage ??
                      _({
                        id: 'canvas.node_variables_panel.filter_empty',
                        message: 'No variables match this filter.',
                      }))}
                </p>
              )}
              {children}
            </div>
          </div>
        </div>
      </div>
      {editing && onEditVariable && (
        <NodeVariableEditDialog
          key={editing.row.node.path}
          variable={editing.details}
          // Its siblings, from both the schema and the value, which the tree merges.
          takenNames={siblingKeys(trees[editing.row.section], editing.row.node.path)}
          referenceFor={renamedReference(editing.row)}
          onSave={(next) => {
            onEditVariable(editing.row, next);
            setEditing(null);
          }}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
