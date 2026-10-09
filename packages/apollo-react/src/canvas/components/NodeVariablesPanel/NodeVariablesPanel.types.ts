import type { ReactNode } from 'react';
import type {
  CopyEvent,
  JsonContainer,
  JsonObject,
  JsonSchema,
  JsonValue,
  PathForCopy,
} from '../JsonTree';

/** The panel's top-level groups, in display order. */
export type NodeVariablesSection = 'inputs' | 'outputs' | 'variables' | 'nodes';

/** Sections whose + sits on the section header. Inputs and Nodes add per node row. */
export type NodeVariablesAddableSection = Extract<NodeVariablesSection, 'outputs' | 'variables'>;

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
  /**
   * Id of the node selected on the canvas. Enables the "Selected node" filter,
   * which narrows Inputs and Nodes to it.
   */
  selectedNodeId?: string;
  /** Called from a node row's "Focus on node" action, shown on every node row. Omit to hide it. */
  onFocusNode?: (nodeId: string) => void;
  /**
   * Called from an add (+) button. Outputs and Variables have one on the
   * section header; Inputs and Nodes have one on each node row, which passes
   * the node's id. Omit to hide them all.
   */
  onAdd?: (section: NodeVariablesSection, nodeId?: string) => void;
  /**
   * Called when the Edit variable dialog is saved, with the variable's current
   * name and its new details (a changed `id` is a rename). Omit to hide the
   * edit action. The type, description, and default value are read from the
   * variable's schema, falling back to its value.
   */
  onEditVariable?: (name: string, next: NodeVariableDetails) => void;
  /** Called from a top-level variable's delete action. Omit to hide it. */
  onDeleteVariable?: (name: string) => void;
  /** Called after a reference (a key's path) or a value is copied to the clipboard. */
  onCopy?: (event: CopyEvent) => void;
  /**
   * Content at the start of the toolbar row, before the search, filter, and
   * expand controls (e.g. the property panel's tabs, so they share one row).
   */
  leading?: ReactNode;
  className?: string;
}
