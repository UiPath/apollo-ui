import type { ComponentType, ReactNode } from 'react';
import type {
  CopyEvent,
  DeriveTypeIcon,
  JsonObject,
  JsonSchema,
  JsonTreeNode,
  JsonTreeRowWrapperProps,
  JsonTreeViewStrings,
  JsonValue,
  NodeAction,
  NodeDecoration,
  PathForCopy,
} from '../JsonTree';

/** The panel's top-level groups, in display order. */
export type NodeVariablesSection = 'inputs' | 'outputs' | 'variables' | 'assets' | 'nodes';

/** Sections whose + sits on the section header. Inputs and Nodes add per node row. */
export type NodeVariablesAddableSection = Extract<
  NodeVariablesSection,
  'outputs' | 'variables' | 'assets'
>;

const ADDABLE_SECTIONS: Record<NodeVariablesAddableSection, true> = {
  outputs: true,
  variables: true,
  assets: true,
};

/**
 * Whether a section has its + on the header. Exhaustive over `NodeVariablesAddableSection`,
 * so adding a section there fails to compile until it is listed here. Own-key check, so a
 * value like `constructor` is never mistaken for a section.
 */
export function isAddableSection(value: string): value is NodeVariablesAddableSection {
  return Object.hasOwn(ADDABLE_SECTIONS, value);
}

/** A tree row, as filters and the row callbacks receive it. */
export interface NodeVariablesRow {
  section: NodeVariablesSection;
  /** The node the row belongs to, for rows in Inputs and Nodes. */
  nodeId?: string;
  node: JsonTreeNode;
  /** The row's reference as the panel copies it (`$vars.flowTest`), after `pathForCopy`. */
  displayPath: string;
}

/** A filter offered in the toolbar's filter menu. */
export interface NodeVariablesFilter {
  id: string;
  label: string;
  /**
   * Keeps a row when it, or anything below it, matches. A row that matches
   * shows its whole subtree. While the filter is on, sections with matches open
   * and the rest are hidden; they can still be collapsed, and clearing the filter
   * restores the earlier expansion. Omit it for a filter that keeps every row
   * (e.g. the host swaps the data instead), which leaves expansion and empty
   * sections alone.
   */
  predicate?: (row: NodeVariablesRow) => boolean;
  /** Shown when the filter leaves nothing. */
  emptyMessage?: string;
}

/** A variable's data type, as the Edit variable dialog offers it. */
export type NodeVariableType = 'string' | 'number' | 'boolean' | 'object' | 'array';

/** A top-level variable as the Edit variable dialog reads and saves it. */
export interface NodeVariableDetails {
  /** The variable's name, referenced as `$vars.<id>`. */
  id: string;
  type: NodeVariableType;
  description?: string;
  /** Omitted when the field is left empty. */
  defaultValue?: JsonValue;
}

/**
 * A schema/value pair keyed by name: the schema gives the structure, the value
 * gives current data, and either one alone works. Every section's data has this
 * shape, from a flow's variables to a node's output (`{ output, error }`).
 */
export interface NodeVariablesData {
  schema?: JsonSchema;
  value?: JsonObject;
}

/** A node whose output can be referenced (an upstream input or any node in the flow). */
export interface NodeVariablesSource extends NodeVariablesData {
  /** Node id. Prefixes every reference in its output, e.g. `httpWebhook1.output.body`. */
  id: string;
  /** Display name, e.g. "HTTP webhook". The id shows in the name's tooltip. */
  label: string;
  /**
   * Icon shown in the row's badge. Connectors pass their full-color brand logo;
   * other nodes pass a small glyph or icon.
   */
  icon?: ReactNode;
  /** Number of outputs shown on the row. Default: the top-level fields of the output. */
  outputCount?: number;
  /** Shows the row's add (+) action when `onAdd` is set. Default: true. */
  addable?: boolean;
}

/** The state of a section header's add (+) button. */
export interface NodeVariablesAddState {
  /** Shows the + but ignores clicks, e.g. while a prerequisite is missing. */
  disabled?: boolean;
  /** Shown on hover and focus, e.g. why the + is disabled. */
  tooltip?: string;
}

/** Props passed to a custom row container: the tree's own, plus where the row sits. */
export interface NodeVariablesRowWrapperProps extends JsonTreeRowWrapperProps {
  section: NodeVariablesSection;
  /** The node the row belongs to, for rows in Inputs and Nodes. */
  nodeId?: string;
}

/**
 * Custom row container (e.g. to make rows drag sources). `displayPath` is the
 * row's reference as the panel copies it (`$vars.flowTest`, `$assets.apiKey`).
 * Must be a stable component reference, like `JsonTreeRowWrapper`.
 */
export type NodeVariablesRowWrapper = ComponentType<NodeVariablesRowWrapperProps>;

/** Context passed to `nodeActions`. */
export interface NodeVariablesActionContext {
  /**
   * The actions the panel would show for this row (copy value, edit and delete,
   * or a node's focus and +), in display order. Spread them to keep the built-ins.
   */
  defaultActions: NodeAction[];
}

/** The panel's user-facing copy. Defaults come from the canvas catalog (Lingui). */
export interface NodeVariablesPanelStrings {
  sectionInputs: string;
  sectionOutputs: string;
  sectionVariables: string;
  sectionAssets: string;
  sectionNodes: string;
  /** A section's count, for assistive technology and its tooltip. */
  inputsCount: (count: number) => string;
  outputsCount: (count: number) => string;
  variablesCount: (count: number) => string;
  assetsCount: (count: number) => string;
  nodesCount: (count: number) => string;
  /** Header + labels. */
  addOutputs: string;
  addVariables: string;
  addAssets: string;
  /** A node row's output count. */
  nodeOutputCount: (count: number) => string;
  /** A node row's + tooltip, and its accessible name. */
  addToNode: string;
  addFromNode: (label: string) => string;
  /** A node row's focus tooltip, and its accessible name. */
  focusNode: string;
  focusNodeLabel: (label: string) => string;
  editVariable: (name: string) => string;
  deleteVariable: (name: string) => string;
  searchPlaceholder: string;
  noMatches: string;
  /** Shown when a filter leaves nothing and has no `emptyMessage`. */
  filterEmpty: string;
}

/** Imperative controls, through the panel's `ref`. */
export interface NodeVariablesPanelHandle {
  /**
   * Brings a row into view: opens its section and its parent rows, scrolls to it,
   * and briefly highlights it. Takes the reference as the panel copies it
   * (`$vars.flowTest`, `$assets.apiKey`). Clears a search or filter that hides
   * the row. When the host controls `expandedSections` or `activeFilterId`, the
   * changes go through `onExpandedSectionsChange` and `onActiveFilterChange`.
   * Apply them synchronously in those callbacks: the reveal scrolls and
   * highlights in the render they trigger, so a change applied later (e.g.
   * after an async store update) opens the row without either. Returns false
   * when no row has that reference. In a section large enough to window its
   * rows, the row is opened but may not be scrolled to. A node in both Inputs
   * and Nodes has the same reference there; the first section in display order wins.
   */
  revealPath: (reference: string) => boolean;
}

/**
 * Each section shows only when its data prop is passed. Pass an empty value
 * (`[]` or `{}`) to show an empty section, e.g. so its + stays reachable.
 */
export interface NodeVariablesPanelProps {
  /** Upstream nodes whose outputs this node can read. */
  inputs?: NodeVariablesSource[];
  /** The flow's declared outputs. */
  outputs?: NodeVariablesData;
  /** The flow's shared variables. Top-level keys are the variable names. */
  variables?: NodeVariablesData;
  /** The flow's declared assets, between Variables and Nodes. Top-level keys are the asset names. */
  assets?: NodeVariablesData;
  /** Every node in the flow, for referencing beyond the direct inputs. */
  nodes?: NodeVariablesSource[];
  /** Path prefix for the Outputs section. Default: none, so an output reads `$vars.result`. */
  outputsBasePath?: string;
  /** Path prefix for the Variables section. Default: none, so a variable reads `$vars.flowTest`. */
  variablesBasePath?: string;
  /** Path prefix for the Assets section. Default: none, so an asset reads `$assets.apiKey`. */
  assetsBasePath?: string;
  /**
   * Root of every reference the panel shows and copies, in every section:
   * `$vars.httpWebhook1.output.body`, `$vars.flowTest`, `$vars.result` (an output),
   * matching flow-workbench. Default: `$vars`. Assets use `assetsReferencePrefix`.
   * Pass an empty string for bare tree paths.
   */
  referencePrefix?: string;
  /** Root of every asset reference, matching flow-workbench: `$assets.apiKey`. Default: `$assets`. */
  assetsReferencePrefix?: string;
  /**
   * Transforms a reference before it is shown and copied. It receives the
   * prefixed reference (see `referencePrefix`) and the raw `segments`, for ids
   * that the path bracket-quotes (e.g. `["node-1"]`). Keep it stable (memoized):
   * the rows are recomputed when it changes.
   */
  pathForCopy?: PathForCopy;
  /**
   * Open sections (controlled). Omit to let the panel keep them, starting with
   * only Nodes open. A search or narrowing filter opens its matches on top of
   * these without changing them.
   */
  expandedSections?: NodeVariablesSection[];
  /**
   * Called when the base expansion changes, by the user or by `revealPath`. Toggles
   * made while a search or filter narrows the panel stay in the panel and are not reported.
   */
  onExpandedSectionsChange?: (sections: NodeVariablesSection[]) => void;
  /**
   * Filters offered in the toolbar's filter menu. Omit to hide the filter control.
   * Keep it stable (memoized): the rows are recomputed when the active filter changes.
   */
  filters?: NodeVariablesFilter[];
  /** Id of the active filter, or null for none (controlled). Omit to let the panel keep it, starting with none. */
  activeFilterId?: string | null;
  /** Called when a filter is picked or cleared from the menu. */
  onActiveFilterChange?: (id: string | null) => void;
  /** Called from a node row's "Focus on node" action, shown on every node row. Omit to hide it. */
  onFocusNode?: (nodeId: string) => void;
  /**
   * Called from an add (+) button. Outputs, Variables, and Assets have one on the
   * section header; Inputs and Nodes have one on each node row, which passes
   * the node's id. Omit to hide them all.
   */
  onAdd?: (section: NodeVariablesSection, nodeId?: string) => void;
  /** Disables a section header's + or gives it a tooltip, e.g. why it can't be used yet. */
  addState?: Partial<Record<NodeVariablesAddableSection, NodeVariablesAddState>>;
  /**
   * Rows that get the edit and delete actions. Array preview rows are never
   * variables. Default: top-level keys in Outputs and Variables. Not consulted
   * for Assets; top-level asset rows always qualify.
   */
  isVariableRow?: (row: NodeVariablesRow) => boolean;
  /** Veto for a variable or asset row that would otherwise offer edit. Default: allow. */
  canEdit?: (row: NodeVariablesRow) => boolean;
  /** Veto for a variable or asset row that would otherwise offer delete. Default: allow. */
  canDelete?: (row: NodeVariablesRow) => boolean;
  /**
   * Whether a row's reference and value can be copied. When false, the name
   * shows as plain text and the copy-value action is left out. Default: every row.
   */
  canCopy?: (row: NodeVariablesRow) => boolean;
  /**
   * Called when the built-in Edit variable dialog is saved, with the row and
   * its new details (a changed `id` is a rename). The dialog reads the type,
   * description, and default value from the row's schema, falling back to its
   * value. Omit (along with `onRequestEditVariable`) to hide the edit action.
   */
  onEditVariable?: (row: NodeVariablesRow, next: NodeVariableDetails) => void;
  /**
   * Called from the edit action so the host can open its own editor. Asset rows,
   * which never use the built-in dialog, always come here. Variable rows come
   * here only when `onEditVariable` is omitted, so pass both to keep the built-in
   * dialog for variables and edit assets in the host. Check `row.section` to
   * tell a variable from an asset.
   */
  onRequestEditVariable?: (row: NodeVariablesRow) => void;
  /** Called from a variable or asset row's delete action (see `row.section`). Omit to hide it. */
  onDeleteVariable?: (row: NodeVariablesRow) => void;
  /** Called after a reference (a key's path) or a value is copied to the clipboard. */
  onCopy?: (event: CopyEvent) => void;
  /**
   * Annotates any row (a chip, a sublabel, a badge icon), merged over the
   * panel's own decoration of node rows: the host's defined fields win (an
   * undefined one keeps the panel's), and `badge` merges field by field. Keep it stable (memoized): the rows are recomputed when it changes.
   */
  decorateNode?: (row: NodeVariablesRow) => NodeDecoration | undefined;
  /**
   * Customizes any row's actions. Return a list (typically `ctx.defaultActions`
   * plus your own), `[]` for none, or undefined to keep the defaults.
   */
  nodeActions?: (
    row: NodeVariablesRow,
    ctx: NodeVariablesActionContext
  ) => NodeAction[] | undefined;
  /**
   * Content at the start of the toolbar row, before the search, filter, and
   * expand controls (e.g. the property panel's tabs, so they share one row).
   */
  leading?: ReactNode;
  /** Custom row container for every section's tree (e.g. to make rows drag sources). */
  rowWrapper?: NodeVariablesRowWrapper;
  /** Custom type-badge icons for every section's tree (e.g. File or Secret icons). */
  deriveTypeIcon?: DeriveTypeIcon;
  /**
   * Overrides for the panel's copy, e.g. from a host's own i18n. Omitted keys
   * use the canvas catalog. Keep it stable (memoized).
   */
  strings?: Partial<NodeVariablesPanelStrings>;
  /** Overrides for the trees' and toolbar's copy (see `JsonTreeViewStrings`). */
  treeStrings?: Partial<JsonTreeViewStrings>;
  /** Extra content after the Nodes section, in the same scroller. */
  children?: ReactNode;
  className?: string;
}
