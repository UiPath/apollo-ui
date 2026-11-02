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
import {
  type ComponentType,
  type ForwardedRef,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
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
  type JsonTreeRowWrapper,
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
import { useNodeVariablesPanelStrings } from './NodeVariablesPanel.strings';
import {
  isAddableSection,
  type NodeVariableDetails,
  type NodeVariablesAddableSection,
  type NodeVariablesPanelHandle,
  type NodeVariablesPanelProps,
  type NodeVariablesRow,
  type NodeVariablesSection,
  type NodeVariablesSource,
  type NodeVariableType,
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

/** Open on first render when the host doesn't control `expandedSections`. */
const DEFAULT_EXPANDED_SECTIONS: NodeVariablesSection[] = ['nodes'];

/** How long a revealed row stays highlighted. */
const REVEAL_HIGHLIGHT_MS = 1500;

type PerSection<T> = Record<NodeVariablesSection, T>;

const NO_PATHS: PerSection<Record<string, boolean>> = {
  inputs: {},
  outputs: {},
  variables: {},
  assets: {},
  nodes: {},
};

/** What the user closed while a search or filter narrows the panel. */
interface NarrowedOverlay {
  closedSections: NodeVariablesSection[];
  /** Rows collapsed during a search, which otherwise holds every match open. */
  collapsedPaths: PerSection<Record<string, boolean>>;
}

const NO_OVERLAY: NarrowedOverlay = { closedSections: [], collapsedPaths: NO_PATHS };

/** Keeps the display order whatever order sections were opened in. */
const inSectionOrder = (sections: Iterable<NodeVariablesSection>) => {
  const set = new Set(sections);
  return SECTIONS.filter((section) => set.has(section));
};

/** The object's fields that are set, so an `undefined` override keeps what it spreads over. */
const definedFields = <T extends object>(value: T | undefined): Partial<T> =>
  Object.fromEntries(
    Object.entries(value ?? {}).filter(([, field]) => field !== undefined)
  ) as Partial<T>;

/** The host's defined fields win; `badge` merges field by field. */
function mergeDecoration(
  builtIn: NodeDecoration | undefined,
  host: NodeDecoration | undefined
): NodeDecoration | undefined {
  if (!builtIn || !host) return host ?? builtIn;
  const badge =
    builtIn.badge || host.badge ? { ...builtIn.badge, ...definedFields(host.badge) } : undefined;
  return { ...builtIn, ...definedFields(host), badge };
}

/** The node whose reference matches, with its parent containers' paths. Stack walk, like objectPaths. */
function findByReference(
  nodes: JsonTreeNode[],
  matches: (node: JsonTreeNode) => boolean
): { node: JsonTreeNode; ancestors: string[] } | undefined {
  const stack = nodes.map((node) => ({ node, ancestors: [] as string[] }));
  while (stack.length > 0) {
    const { node, ancestors } = stack.pop()!;
    if (matches(node)) return { node, ancestors };
    for (const child of node.children ?? []) {
      stack.push({ node: child, ancestors: [...ancestors, node.path] });
    }
  }
  return undefined;
}

/**
 * Real entries among sibling nodes. The tree adds a preview item to schema-only
 * or empty arrays; it isn't a real element, so it isn't counted.
 */
const countEntries = (nodes: JsonTreeNode[] | undefined) =>
  nodes?.filter((node) => !isArrayItemTemplateRoot(node)).length ?? 0;

/** A node row's output count: the host's, else its output's top-level fields. */
const outputCountOf = (source: NodeVariablesSource | undefined, node: JsonTreeNode) =>
  source?.outputCount ?? countEntries(node.children);

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

/** The node a row in Inputs or Nodes belongs to. */
const nodeIdOf = (section: NodeVariablesSection, node: JsonTreeNode) =>
  isSourceSection(section) ? String(node.segments[0]) : undefined;

/** The row a tree node is, as filters and the row callbacks see it. */
function rowFor(
  section: NodeVariablesSection,
  node: JsonTreeNode,
  toReference: PathForCopy
): NodeVariablesRow {
  const displayPath = toReference(node.path, node.segments);
  const nodeId = nodeIdOf(section, node);
  return nodeId === undefined
    ? { section, node, displayPath }
    : { section, nodeId, node, displayPath };
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
 * shared variables, its declared assets, and every node in the flow. Each
 * section shows only when its data is passed.
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
 * `decorateNode` and `nodeActions` extend any row; filters come from the host.
 * Open sections and the active filter are each controlled by one prop, or kept
 * by the panel when it is omitted. `ref.revealPath` brings a row into view.
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
function NodeVariablesPanelRender(
  {
    inputs,
    outputs,
    variables,
    assets,
    nodes,
    outputsBasePath,
    variablesBasePath,
    assetsBasePath,
    referencePrefix = '$vars',
    assetsReferencePrefix = '$assets',
    pathForCopy,
    expandedSections: expandedSectionsProp,
    onExpandedSectionsChange,
    filters,
    activeFilterId: activeFilterIdProp,
    onActiveFilterChange,
    onFocusNode,
    onAdd,
    addState,
    isVariableRow = isTopLevelVariable,
    canEdit,
    canDelete,
    canCopy,
    onEditVariable,
    onRequestEditVariable,
    onDeleteVariable,
    onCopy,
    decorateNode,
    nodeActions,
    leading,
    rowWrapper,
    deriveTypeIcon,
    deriveTypeLabel,
    strings: stringOverrides,
    treeStrings,
    children,
    className,
  }: NodeVariablesPanelProps,
  ref: ForwardedRef<NodeVariablesPanelHandle>
) {
  const strings = useNodeVariablesPanelStrings(stringOverrides);

  // A section shows only when the host passes its data.
  const sectionData = { inputs, outputs, variables, assets, nodes };
  const present = SECTIONS.filter((section) => sectionData[section] !== undefined);

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

  const trees = useMemo<PerSection<JsonTreeNode[]>>(
    () => ({
      inputs: buildSourceTree(inputs ?? []),
      outputs: buildJsonTree({ ...outputs, basePath: basePaths.get('outputs') }),
      variables: buildJsonTree({ ...variables, basePath: basePaths.get('variables') }),
      assets: buildJsonTree({ ...assets, basePath: basePaths.get('assets') }),
      nodes: buildSourceTree(nodes ?? []),
    }),
    [inputs, outputs, variables, assets, nodes, basePaths]
  );
  // One lookup per section: an upstream input also appears in Nodes, and each
  // list's own metadata (label, icon, output count) must win in its section.
  const sourcesById = useMemo<Record<SourceSection, Map<string, NodeVariablesSource>>>(
    () => ({
      inputs: new Map((inputs ?? []).map((source) => [source.id, source])),
      nodes: new Map((nodes ?? []).map((source) => [source.id, source])),
    }),
    [inputs, nodes]
  );

  const [uncontrolledSections, setUncontrolledSections] = useState(DEFAULT_EXPANDED_SECTIONS);
  const baseSections = expandedSectionsProp ?? uncontrolledSections;
  const setBaseSections = (next: NodeVariablesSection[]) => {
    if (expandedSectionsProp === undefined) setUncontrolledSections(next);
    onExpandedSectionsChange?.(next);
  };

  // Containers start collapsed. Tracking the opened paths (rather than the
  // collapsed ones) keeps containers that appear later, such as a renamed
  // object variable, collapsed by default too. Kept per section: each section is
  // its own tree, and the same path can appear in two (a node in Inputs and Nodes).
  const [openPaths, setOpenPaths] = useState<PerSection<Record<string, boolean>>>(NO_PATHS);
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
      ) as PerSection<Record<string, boolean>>,
    [trees, openPaths]
  );
  // Large sections (big run outputs) mount only the rows in view, windowed
  // against the panel's scroller; small ones render normally.
  const virtualize = useMemo(
    () =>
      Object.fromEntries(
        SECTIONS.map((section) => [section, exceedsVirtualizeThreshold(trees[section])])
      ) as PerSection<boolean>,
    [trees]
  );
  const [scroller, setScroller] = useState<HTMLDivElement | null>(null);
  const [query, setQuery] = useState('');
  const [uncontrolledFilterId, setUncontrolledFilterId] = useState<string | null>(null);
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
  const filterPredicate = activeFilter?.predicate;
  // Search and a filter with a predicate hide sections without matches and open the rest.
  const narrowing = !!search || !!filterPredicate;

  // The toolbar only lists the options; matching runs per section below.
  const toolbarFilters = useMemo<JsonTreeFilterOption[] | undefined>(
    () => filters?.map(({ id, label }) => ({ id, label, predicate: () => true })),
    [filters]
  );
  // The active filter as each section's tree predicate, with the row it sees.
  const filterPredicates = useMemo(
    () =>
      filterPredicate
        ? (Object.fromEntries(
            SECTIONS.map((section) => [
              section,
              (node: JsonTreeNode) => filterPredicate(rowFor(section, node, referenceFor(section))),
            ])
          ) as PerSection<(node: JsonTreeNode) => boolean>)
        : undefined,
    [filterPredicate, referenceFor]
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
        const count = outputCountOf(source, node);
        const countLabel = strings.nodeOutputCount(count);
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
  }, [sourcesById, strings]);
  // Every section's decoration: the built-in one for node rows, with the host's merged over it.
  const decorators = useMemo(
    () =>
      Object.fromEntries(
        SECTIONS.map((section) => {
          const builtIn = isSourceSection(section) ? decorateSource[section] : undefined;
          if (!decorateNode) return [section, builtIn];
          return [
            section,
            (node: JsonTreeNode) =>
              mergeDecoration(
                builtIn?.(node),
                decorateNode(rowFor(section, node, referenceFor(section)))
              ),
          ];
        })
      ) as PerSection<((node: JsonTreeNode) => NodeDecoration | undefined) | undefined>,
    [decorateSource, decorateNode, referenceFor]
  );

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
                displayTexts: decorators[section],
              }).length
            : 1,
        ])
      ) as PerSection<number>,
    [narrowing, trees, search, filterPredicates, decorators]
  );
  // Inputs count the triggers' outputs, the fields an author references; Nodes count nodes.
  const totalCount: PerSection<number> = {
    inputs: trees.inputs.reduce(
      (sum, node) => sum + outputCountOf(sourcesById.inputs.get(String(node.segments[0])), node),
      0
    ),
    outputs: countEntries(trees.outputs),
    variables: countEntries(trees.variables),
    assets: countEntries(trees.assets),
    nodes: nodes?.length ?? 0,
  };

  // While narrowed, the sections with matches open over the host's expansion,
  // which is left as it was, and a search also opens every matching row. Each
  // new search or filter starts over: only what was closed since then stays closed.
  const narrowKey = narrowing ? JSON.stringify([search, filterPredicate && activeFilterId]) : null;
  const [narrowed, setNarrowed] = useState<(NarrowedOverlay & { key: string }) | null>(null);
  // Dropped as soon as the narrowing changes, so returning to an earlier query starts over too.
  if (narrowed && narrowed.key !== narrowKey) setNarrowed(null);
  const overlay = narrowKey && narrowed?.key === narrowKey ? narrowed : NO_OVERLAY;
  // Functional, so two changes in one handler (sections, then rows) both land.
  const updateOverlay = (change: (current: NarrowedOverlay) => Partial<NarrowedOverlay>) => {
    if (!narrowKey) return;
    setNarrowed((previous) => {
      const current = previous?.key === narrowKey ? previous : { key: narrowKey, ...NO_OVERLAY };
      return { ...current, ...change(current) };
    });
  };
  const openSections = narrowKey
    ? present.filter(
        (section) => visibleCount[section] > 0 && !overlay.closedSections.includes(section)
      )
    : baseSections;
  const setOpenSections = (next: NodeVariablesSection[]) => {
    if (!narrowKey) return setBaseSections(inSectionOrder(next));
    updateOverlay(() => ({
      closedSections: present.filter((section) => !next.includes(section)),
    }));
  };
  const setSectionOpen = (section: NodeVariablesSection, open: boolean) =>
    setOpenSections(
      open ? [...openSections, section] : openSections.filter((item) => item !== section)
    );

  const collapsedIn = (section: NodeVariablesSection) =>
    search ? overlay.collapsedPaths[section] : collapsed[section];
  const toggleCollapsed = (section: NodeVariablesSection) => (path: string) => {
    if (search) {
      updateOverlay(({ collapsedPaths }) => ({
        collapsedPaths: {
          ...collapsedPaths,
          [section]: {
            ...collapsedPaths[section],
            [path]: !isPathCollapsed(collapsedPaths[section], path),
          },
        },
      }));
      return;
    }
    setOpenPaths((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [path]: isPathCollapsed(collapsed[section], path),
      },
    }));
  };

  // "Expand all" opens every section with content and every object. Empty
  // sections and arrays (which can be long) stay as they are. A node row counts
  // as content even with no outputs, since its + adds them.
  const expandableSections = present.filter((section) => {
    if (narrowing) return visibleCount[section] > 0;
    return isSourceSection(section) ? trees[section].length > 0 : totalCount[section] > 0;
  });
  const expandablePaths = useMemo(
    () =>
      Object.fromEntries(
        SECTIONS.map((section) => [section, objectPaths(trees[section])])
      ) as PerSection<string[]>,
    [trees]
  );
  const allExpanded =
    expandableSections.length > 0 &&
    expandableSections.every((section) => openSections.includes(section)) &&
    present.every((section) =>
      expandablePaths[section].every((path) => !isPathCollapsed(collapsedIn(section), path))
    );
  const toggleAll = () => {
    const open = !allExpanded;
    setOpenSections(open ? expandableSections : []);
    const pathsFor = (section: NodeVariablesSection, collapse: boolean) =>
      Object.fromEntries(expandablePaths[section].map((path) => [path, collapse]));
    if (search) {
      updateOverlay(({ collapsedPaths }) => ({
        collapsedPaths: Object.fromEntries(
          SECTIONS.map((section) => [
            section,
            { ...collapsedPaths[section], ...pathsFor(section, !open) },
          ])
        ) as PerSection<Record<string, boolean>>,
      }));
      return;
    }
    setOpenPaths(
      (current) =>
        Object.fromEntries(
          SECTIONS.map((section) => [section, { ...current[section], ...pathsFor(section, open) }])
        ) as PerSection<Record<string, boolean>>
    );
  };

  const sourceActions = (section: SourceSection, node: JsonTreeNode): NodeAction[] => {
    const source = sourcesById[section].get(String(node.segments[0]));
    const label = source?.label ?? node.key;
    const actions: NodeAction[] = [];
    if (onAdd && source?.addable !== false) {
      actions.push({
        id: 'add-to-node',
        icon: <Plus />,
        label: strings.addFromNode(label),
        tooltip: strings.addToNode,
        // Always shown, after the count, like the section header's +.
        persistent: true,
        onSelect: () => onAdd(section, node.key),
      });
    }
    if (onFocusNode) {
      actions.unshift({
        id: 'focus-node',
        icon: <MousePointerClick />,
        label: strings.focusNodeLabel(label),
        tooltip: strings.focusNode,
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
  const variableActions = (row: NodeVariablesRow, defaultActions: NodeAction[]) => {
    const { node } = row;
    const actions: NodeAction[] = [...defaultActions];
    // The built-in dialog edits a variable's type and default, which assets don't have:
    // when onEditVariable is set it takes variable rows, and onRequestEditVariable the rest.
    const builtIn = Boolean(onEditVariable) && row.section !== 'assets';
    if ((builtIn || onRequestEditVariable) && canEdit?.(row) !== false) {
      actions.push({
        id: 'edit-variable',
        icon: <Pencil />,
        label: strings.editVariable(node.key),
        onSelect: () => (builtIn ? openEditDialog(row) : onRequestEditVariable?.(row)),
      });
    }
    if (onDeleteVariable && canDelete?.(row) !== false) {
      actions.push({
        id: 'delete-variable',
        icon: <Trash2 />,
        label: strings.deleteVariable(node.key),
        tone: 'error',
        onSelect: () => onDeleteVariable(row),
      });
    }
    return actions;
  };

  const builtInActions = (row: NodeVariablesRow, defaultActions: NodeAction[]) => {
    const { section, node } = row;
    if (isSourceSection(section) && node.segments.length === 1) {
      return sourceActions(section, node);
    }
    // Array preview rows stand for an item shape, never a variable or an asset.
    if (node.isArrayItemTemplate) return defaultActions;
    // Assets are host-managed: a custom isVariableRow never reaches them, nested fields included.
    if (section === 'assets') {
      return isTopLevelAsset(row) ? variableActions(row, defaultActions) : defaultActions;
    }
    return isVariableRow(row) ? variableActions(row, defaultActions) : defaultActions;
  };

  const actionsFor =
    (section: NodeVariablesSection): NodeActionsResolver =>
    (node, ctx) => {
      const row = rowFor(section, node, referenceFor(section));
      const defaultActions =
        canCopy?.(row) === false
          ? ctx.defaultActions.filter((action) => action.id !== 'copy-value')
          : ctx.defaultActions;
      const actions = builtInActions(row, defaultActions);
      return nodeActions?.(row, { defaultActions: actions }) ?? actions;
    };

  // Each section's wrapper hands the host's the row's section and node.
  // Memoized on the host's wrapper alone: a new component type would remount every row.
  const sectionRowWrappers = useMemo(() => {
    if (!rowWrapper) return undefined;
    const HostRow = rowWrapper;
    return Object.fromEntries(
      SECTIONS.map((section) => {
        const SectionRow: JsonTreeRowWrapper = (props) => (
          <HostRow {...props} section={section} nodeId={nodeIdOf(section, props.node)} />
        );
        return [section, SectionRow];
      })
    ) as PerSection<JsonTreeRowWrapper>;
  }, [rowWrapper]);

  /** Where a renamed variable would be referenced, shown in the dialog. */
  const renamedReference =
    ({ section, node }: NodeVariablesRow) =>
    (id: string) => {
      const basePath = basePaths.get(section) ?? '';
      const parentSegments = node.segments.slice(0, -1);
      const path = [...parentSegments, id].reduce<string>(appendPathSegment, basePath);
      return referenceFor(section)(path, [...parentSegments, id]);
    };

  const sectionName: PerSection<string> = {
    inputs: strings.sectionInputs,
    outputs: strings.sectionOutputs,
    variables: strings.sectionVariables,
    assets: strings.sectionAssets,
    nodes: strings.sectionNodes,
  };
  const sectionCountLabel = (section: NodeVariablesSection, count: number) =>
    ({
      inputs: strings.inputsCount,
      outputs: strings.outputsCount,
      variables: strings.variablesCount,
      assets: strings.assetsCount,
      nodes: strings.nodesCount,
    })[section](count);
  const addLabel: Record<NodeVariablesAddableSection, string> = {
    outputs: strings.addOutputs,
    variables: strings.addVariables,
    assets: strings.addAssets,
  };

  const { ref: scrollRef, contentRef, edges, onScroll } = useScrollEdges();

  // A reveal waits for the render that opens its section and rows, then scrolls
  // to the row and highlights it. A windowed section may not have mounted it.
  // A new object per call, so revealing the same row twice runs again.
  const [pendingReveal, setPendingReveal] = useState<{
    section: NodeVariablesSection;
    path: string;
  } | null>(null);
  useEffect(() => {
    if (!pendingReveal) return;
    const sectionElement = contentRef.current?.querySelector<HTMLElement>(
      `[data-section="${pendingReveal.section}"]`
    );
    const row = Array.from(
      sectionElement?.querySelectorAll<HTMLElement>('[role="row"]') ?? []
    ).find((element) => element.dataset.path === pendingReveal.path);
    (row ?? sectionElement)?.scrollIntoView?.({ block: 'nearest' });
    if (!row) return;
    row.setAttribute('data-revealed', '');
    const timer = setTimeout(() => row.removeAttribute('data-revealed'), REVEAL_HIGHLIGHT_MS);
    return () => {
      clearTimeout(timer);
      row.removeAttribute('data-revealed');
    };
  }, [pendingReveal, contentRef]);

  const revealPath = (reference: string) => {
    for (const section of present) {
      const toReference = referenceFor(section);
      const found = findByReference(
        trees[section],
        (node) => toReference(node.path, node.segments) === reference
      );
      if (!found) continue;
      const { node, ancestors } = found;
      const shows = (rowQuery: string, filterPredicate?: (node: JsonTreeNode) => boolean) =>
        flattenJsonTree(trees[section], {
          collapsed: {},
          query: rowQuery,
          filterPredicate,
          displayTexts: decorators[section],
        }).some((row) => row.node.path === node.path);
      const clearsFilter = !!filterPredicate && !shows('', filterPredicates?.[section]);
      const clearsSearch = !!search && !shows(search);
      if (clearsFilter) changeFilter(null);
      if (clearsSearch) setQuery('');
      // Opened in the host's expansion, and in the narrowing if it stays on (clearing
      // either starts it over, with every match open).
      if (!baseSections.includes(section)) {
        setBaseSections(inSectionOrder([...baseSections, section]));
      }
      setOpenPaths((current) => ({
        ...current,
        [section]: {
          ...current[section],
          ...Object.fromEntries(ancestors.map((path) => [path, true])),
        },
      }));
      if (!clearsFilter && !clearsSearch) {
        updateOverlay(({ closedSections, collapsedPaths }) => ({
          closedSections: closedSections.filter((item) => item !== section),
          collapsedPaths: {
            ...collapsedPaths,
            [section]: {
              ...collapsedPaths[section],
              ...Object.fromEntries(ancestors.map((path) => [path, false])),
            },
          },
        }));
      }
      setPendingReveal({ section, path: node.path });
      return true;
    }
    return false;
  };
  useImperativeHandle(ref, () => ({ revealPath }));

  const renderTree = (section: NodeVariablesSection) => (
    <JsonTreeView
      nodes={trees[section]}
      collapsed={collapsedIn(section)}
      onToggleCollapsed={toggleCollapsed(section)}
      query={search}
      filterPredicate={filterPredicates?.[section]}
      readOnly
      decorateNode={decorators[section]}
      deriveTypeIcon={deriveTypeIcon}
      deriveTypeLabel={deriveTypeLabel}
      rowWrapper={sectionRowWrappers?.[section]}
      nodeActions={actionsFor(section)}
      // Room for copy plus edit and delete on variable rows.
      maxInlineActions={4}
      pathForCopy={referenceFor(section)}
      canCopyPath={
        canCopy ? (node) => canCopy(rowFor(section, node, referenceFor(section))) : undefined
      }
      onCopy={onCopy}
      virtualized={virtualize[section]}
      scrollElement={virtualize[section] ? scroller : undefined}
      strings={treeStrings}
      className="h-auto py-1"
    />
  );

  const renderAddButton = (section: NodeVariablesAddableSection) => {
    const { disabled = false, tooltip } = addState?.[section] ?? {};
    const button = (
      // The same button as the tree's row actions, so header and row + match.
      // aria-disabled rather than disabled, so the button keeps focus and its tooltip.
      <Button
        variant="ghost"
        size="4xs"
        icon
        aria-label={addLabel[section]}
        aria-disabled={disabled || undefined}
        onClick={() => {
          if (!disabled) onAdd?.(section);
        }}
        className="shrink-0 rounded text-foreground-subtle hover:bg-surface-raised hover:text-foreground aria-disabled:cursor-not-allowed aria-disabled:opacity-50 aria-disabled:hover:bg-transparent aria-disabled:hover:text-foreground-subtle [&_svg]:size-2.75"
      >
        <Plus />
      </Button>
    );
    return tooltip ? (
      <CanvasTooltip content={tooltip} placement="top">
        {button}
      </CanvasTooltip>
    ) : (
      button
    );
  };

  const renderSection = (section: NodeVariablesSection) => {
    if (narrowing && visibleCount[section] === 0) return null;
    const open = openSections.includes(section);
    const name = sectionName[section];
    const count = totalCount[section];
    const { Icon, className: iconClassName } = SECTION_ICONS[section];
    // Inputs and Nodes add per node row instead (see sourceActions).
    const addable = isAddableSection(section) && onAdd ? section : null;

    return (
      <Collapsible
        key={section}
        open={open}
        onOpenChange={(next) => setSectionOpen(section, next)}
        asChild
      >
        <section
          aria-label={name}
          data-section={section}
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
            <CollapsibleTrigger className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left">
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
            {addable && renderAddButton(addable)}
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

  // A callback ref, so virtualized sections get the scroller once it mounts.
  const setScrollRef = useCallback(
    (element: HTMLDivElement | null) => {
      scrollRef.current = element;
      setScroller(element);
    },
    [scrollRef]
  );
  const nothingVisible = narrowing && present.every((section) => visibleCount[section] === 0);

  return (
    <div className={cn('flex min-h-0 flex-1 flex-col', className)}>
      <JsonTreeToolbar
        query={query}
        onQueryChange={setQuery}
        searchPlaceholder={strings.searchPlaceholder}
        filters={toolbarFilters}
        activeFilterId={activeFilter ? activeFilterId : null}
        onFilterChange={changeFilter}
        allCollapsed={!allExpanded}
        onToggleAll={toggleAll}
        leading={leading}
        strings={treeStrings}
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
            {/* A revealed row fades in a highlight (set by revealPath). */}
            <div
              ref={contentRef}
              className="[&_[role=row]]:transition-colors [&_[role=row][data-revealed]]:bg-brand/15"
            >
              {present.map(renderSection)}
              {nothingVisible && (
                <p className={EMPTY_MESSAGE_CLASS}>
                  {search ? strings.noMatches : (activeFilter?.emptyMessage ?? strings.filterEmpty)}
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

export const NodeVariablesPanel = forwardRef(NodeVariablesPanelRender);
NodeVariablesPanel.displayName = 'NodeVariablesPanel';
