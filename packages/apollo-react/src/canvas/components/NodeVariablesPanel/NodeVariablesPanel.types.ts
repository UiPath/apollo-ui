import type { ReactNode } from 'react';
import type {
  CopyEvent,
  DeriveTypeIcon,
  JsonContainer,
  JsonObject,
  JsonSchema,
  JsonTreeNode,
  JsonTreeRowWrapper,
  JsonValue,
  PathForCopy,
} from '../JsonTree';

/** The panel's top-level groups, in display order. */
export type NodeVariablesSection = 'inputs' | 'outputs' | 'variables' | 'nodes';

/** Sections whose + sits on the section header. Inputs and Nodes add per node row. */
export type NodeVariablesAddableSection = Extract<NodeVariablesSection, 'outputs' | 'variables'>;

/** A tree row, as filters and the variable callbacks receive it. */
export interface NodeVariablesRow {
  section: NodeVariablesSection;
  /** The node the row belongs to, for rows in Inputs and Nodes. */
  nodeId?: string;
  node: JsonTreeNode;
}

/** A filter offered in the toolbar's filter menu. */
export interface NodeVariablesFilter {
  id: string;
  label: string;
  /**
   * Keeps a row when it, or anything below it, matches. A row that matches
   * shows its whole subtree. A section disappears when none of its rows match.
   */
  predicate: (row: NodeVariablesRow) => boolean;
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
 * A schema/value pair, the same contract as `NodeIOView`: the schema gives the
 * structure, the value gives current data. Either one alone works.
 */
export interface NodeVariablesData {
  schema?: JsonSchema;
  value?: JsonContainer;
}

/** The flow's variables: an object keyed by variable name. */
export interface NodeVariablesVariables {
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

export interface NodeVariablesPanelProps {
  /** Upstream nodes whose outputs this node can read. */
  inputs?: NodeVariablesSource[];
  /** The flow's declared outputs. */
  outputs?: NodeVariablesData;
  /**
   * The flow's shared variables. Top-level keys are the variable names, so the
   * value is an object (not an array) and the schema should describe one.
   */
  variables?: NodeVariablesVariables;
  /** Every node in the flow, for referencing beyond the direct inputs. */
  nodes?: NodeVariablesSource[];
  /** Path prefix for the Outputs section. Default: none, so an output reads `$vars.result`. */
  outputsBasePath?: string;
  /** Path prefix for the Variables section. Default: none, so a variable reads `$vars.flowTest`. */
  variablesBasePath?: string;
  /**
   * Root of every reference the panel shows and copies, in every section:
   * `$vars.httpWebhook1.output.body`, `$vars.flowTest`, `$vars.result` (an output),
   * matching flow-workbench. Default: `$vars`.
   * Pass an empty string for bare tree paths.
   */
  referencePrefix?: string;
  /**
   * Transforms a reference before it is shown and copied. It receives the
   * prefixed reference (see `referencePrefix`) and the raw `segments`, for ids
   * that the path bracket-quotes (e.g. `["node-1"]`).
   */
  pathForCopy?: PathForCopy;
  /** Sections open on first render. Default: only Nodes. */
  defaultExpandedSections?: NodeVariablesSection[];
  /** Filters offered in the toolbar's filter menu. Omit to hide the filter control. */
  filters?: NodeVariablesFilter[];
  /** Id of the active filter, or null for none (controlled). */
  activeFilterId?: string | null;
  /** Id of the filter active on first render (uncontrolled). Default: none. */
  defaultActiveFilterId?: string | null;
  /** Called when a filter is picked or cleared from the menu. */
  onActiveFilterChange?: (id: string | null) => void;
  /** Called from a node row's "Focus on node" action, shown on every node row. Omit to hide it. */
  onFocusNode?: (nodeId: string) => void;
  /**
   * Called from an add (+) button. Outputs and Variables have one on the
   * section header; Inputs and Nodes have one on each node row, which passes
   * the node's id. Omit to hide them all.
   */
  onAdd?: (section: NodeVariablesSection, nodeId?: string) => void;
  /**
   * Rows that get the edit and delete actions. Array preview rows are never
   * variables. Default: top-level keys in Outputs and Variables.
   */
  isVariableRow?: (row: NodeVariablesRow) => boolean;
  /**
   * Called when the built-in Edit variable dialog is saved, with the row and
   * its new details (a changed `id` is a rename). The dialog reads the type,
   * description, and default value from the row's schema, falling back to its
   * value. Omit (along with `onRequestEditVariable`) to hide the edit action.
   */
  onEditVariable?: (row: NodeVariablesRow, next: NodeVariableDetails) => void;
  /**
   * Called from the edit action instead of opening the built-in dialog, so the
   * host can open its own. Takes precedence over `onEditVariable`.
   */
  onRequestEditVariable?: (row: NodeVariablesRow) => void;
  /** Called from a variable row's delete action. Omit to hide it. */
  onDeleteVariable?: (row: NodeVariablesRow) => void;
  /** Called after a reference (a key's path) or a value is copied to the clipboard. */
  onCopy?: (event: CopyEvent) => void;
  /**
   * Content at the start of the toolbar row, before the search, filter, and
   * expand controls (e.g. the property panel's tabs, so they share one row).
   */
  leading?: ReactNode;
  /** Custom row container for every section's tree (e.g. to make rows drag sources). */
  rowWrapper?: JsonTreeRowWrapper;
  /** Custom type-badge icons for every section's tree (e.g. File or Secret icons). */
  deriveTypeIcon?: DeriveTypeIcon;
  /** Extra content after the Nodes section, in the same scroller (e.g. an Assets section). */
  children?: ReactNode;
  className?: string;
}
