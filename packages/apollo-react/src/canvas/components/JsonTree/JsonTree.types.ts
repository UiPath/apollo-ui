import type { ComponentType, CSSProperties, MouseEvent, ReactNode } from 'react';

/** Any JSON-serializable value. */
export type JsonValue = string | number | boolean | null | JsonValue[] | JsonObject;

/** A JSON object (string keys, JSON values). */
export interface JsonObject {
  [key: string]: JsonValue;
}

/**
 * A JSON container: object or array. The value tree renders fields of a
 * container, so its root value must be one of these (a scalar root has no
 * fields to show).
 */
export type JsonContainer = JsonObject | JsonValue[];

/** JSON Schema `type` keyword values supported by the value tree. */
export type JsonSchemaTypeName =
  | 'string'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'object'
  | 'array'
  | 'null';

/**
 * The subset of JSON Schema the value tree understands. Unknown keywords are
 * ignored, so a full draft schema can be passed as-is.
 */
export interface JsonSchema {
  type?: JsonSchemaTypeName | JsonSchemaTypeName[];
  title?: string;
  description?: string;
  /** Semantic format marker (e.g. `file`). Useful for custom value rendering. */
  format?: string;
  enum?: Array<string | number | boolean | null>;
  default?: JsonValue;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  items?: JsonSchema;
  additionalProperties?: boolean | JsonSchema;
}

/** Effective display type of a tree node (JSON value types). */
export type JsonTreeNodeType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null';

/** One step into a JSON value: an object key or an array index. */
export type PathSegment = string | number;

/** A node of the merged schema + value tree. */
export interface JsonTreeNode {
  /** Display key (object key or array index as text). */
  key: string;
  /** Expression path, e.g. `httpRequest1.responseBody.items[0].id`. */
  path: string;
  /** Path as raw segments, usable with `setValueAtPath`/`getValueAtPath`. */
  segments: PathSegment[];
  /** Effective type: from the value when present, else from the schema. */
  type: JsonTreeNodeType;
  /**
   * The value at this node. Undefined when the schema declares this node but
   * the value does not set it (rendered as "unset").
   */
  value?: JsonValue;
  /** The schema node describing this position, when one exists. */
  schema?: JsonSchema;
  /** True when the schema lists this key in the parent's `required`. */
  required?: boolean;
  /** Present on object/array nodes (may be empty). */
  children?: JsonTreeNode[];
  /**
   * True when this node belongs to a synthesized, read-only preview of an
   * array's `items` schema. When an array has no real items, the tree surfaces
   * the expected item shape by building one preview item from `items`; the flag
   * is set on that item and every node beneath it. The preview is illustrative,
   * so these nodes are not editable and the preview item is left out of the
   * parent array's item count.
   */
  isArrayItemTemplate?: boolean;
}

/** A consumer-provided row filter, offered in the toolbar's filter dropdown. */
export interface JsonTreeFilterOption {
  id: string;
  /** Label shown in the dropdown and on the trigger when active. */
  label: string;
  /**
   * Rows are kept when the node (or any descendant) matches; a node that
   * matches directly shows its whole subtree.
   */
  predicate: (node: JsonTreeNode) => boolean;
  /** Optional count shown next to the label. */
  count?: number;
}

/** Visual tone for decoration chips. */
export type NodeDecorationTone = 'neutral' | 'info' | 'warning' | 'error';

/**
 * Derives a custom type-badge icon for a node (e.g. a paperclip for
 * `format: 'file'` schemas). Return undefined to keep the default type icon.
 */
export type DeriveTypeIcon = (node: JsonTreeNode) => ReactNode;

/** Chip annotation next to a node's key. Provide a label, an icon, or both. */
export interface NodeDecorationChip {
  /** Pill text. Omit for a bare icon-only annotation. */
  label?: string;
  /** Icon rendered before the label (or alone when there is no label). */
  icon?: ReactNode;
  /** Tooltip shown on hover. */
  tooltip?: string;
  tone?: NodeDecorationTone;
}

/** Overrides for the row's type badge (the leading icon-in-a-box). */
export interface NodeDecorationBadge {
  /** Replaces the type icon (wins over `deriveTypeIcon`). */
  icon?: ReactNode;
  /**
   * Color classes for the badge chrome (border/bg/text), replacing the
   * neutral default, e.g. `'border-info/30 bg-info/10 text-info'`.
   */
  className?: string;
}

/** Consumer-provided visual annotation for a tree node. */
export interface NodeDecoration {
  /**
   * Display label rendered in place of the raw key. The raw key still drives
   * paths, copying, and edits; search matches both.
   */
  label?: string;
  /** Small muted text after the key label (e.g. an identifier). */
  sublabel?: string;
  /** Replaces the type badge's icon and/or color. */
  badge?: NodeDecorationBadge;
  /** Small pill rendered next to the key (e.g. "mocked"). */
  chip?: NodeDecorationChip;
  /**
   * Hides the built-in keys/items count on a container row.
   */
  hideCount?: boolean;
}

/** Context passed to a custom value cell renderer. */
export interface RenderValueContext {
  readOnly: boolean;
  /** Commits a new value for the node (routed through `onValueChange`). */
  commit: (value: JsonValue) => void;
  /**
   * Removes the value at the node's path (the key is deleted from its parent
   * container). Routed through `onValueChange` with a `JsonTreeChange` whose
   * `value` is undefined. Schema-declared nodes render as "unset" afterwards.
   */
  clear: () => void;
}

/**
 * Custom value cell renderer. Return a ReactNode to replace the default value
 * cell for that node (for containers it renders next to the key); return
 * undefined to keep the default rendering.
 */
export type RenderValueCell = (node: JsonTreeNode, ctx: RenderValueContext) => ReactNode;

/**
 * A trailing row action rendered in a node's action group (the icon buttons
 * revealed on row hover). Built-ins use the ids `wrap` | `edit-json` |
 * `copy-value`; consumer actions supply their own stable id.
 */
export interface NodeAction {
  /** Stable identifier (also the React key). */
  id: string;
  /** Icon element (e.g. a lucide icon). The tree sizes it — no explicit size needed. */
  icon: ReactNode;
  /** Accessible name (aria-label). Also the hover tooltip unless `tooltip` is set. */
  label: string;
  /** Hover tooltip text; defaults to `label`. */
  tooltip?: string;
  /** Invoked when the action is triggered, with the row's node. */
  onSelect: (node: JsonTreeNode) => void;
  /** Renders in an active/highlighted state (e.g. wrap while a row is wrapped). */
  active?: boolean;
  /** Disables the control. */
  disabled?: boolean;
  /** Color tone; `error` tints a destructive action. Defaults to neutral. */
  tone?: NodeDecorationTone;
}

/** Context passed to `nodeActions`, mirroring the value-cell edit context. */
export interface NodeActionContext {
  readOnly: boolean;
  /**
   * The actions the tree would render by default for this node (wrap,
   * edit-as-JSON, copy-value), in display order. Spread these to keep the
   * built-ins while adding or reordering your own.
   */
  defaultActions: NodeAction[];
  /** Commits a new value for the node (routed through `onEdit`/`onValueChange`). */
  commit: (value: JsonValue) => void;
  /** Removes the node's value (the key is deleted from its parent container). */
  clear: () => void;
}

/**
 * Customizes the trailing row actions per node. Return a new list (typically
 * composed with `ctx.defaultActions`), an empty array to show no actions for
 * that node, or `undefined` to keep the defaults. The tree owns the rendering,
 * the hover reveal, the overflow menu, and a11y.
 */
export type NodeActionsResolver = (
  node: JsonTreeNode,
  ctx: NodeActionContext
) => NodeAction[] | undefined;

/** Payload for copy events. */
export interface CopyEvent {
  /** What was copied: the node's path or its value. */
  kind: 'path' | 'value';
  path: string;
  /** The text placed on the clipboard. */
  text: string;
}

/** Details about a single value edit. */
export interface JsonTreeChange {
  path: string;
  segments: PathSegment[];
  /** The newly committed value at `path`. Undefined when the value was removed. */
  value?: JsonValue;
  /** The previous value at `path` (undefined when it did not exist). */
  previous?: JsonValue;
}

/**
 * Props passed to a custom row container. The wrapper IS the row element:
 * render a single container applying `className`/`style` and `children`
 * verbatim, plus whatever behavior you attach (e.g. dnd-kit drag listeners).
 */
export interface JsonTreeRowWrapperProps {
  node: JsonTreeNode;
  className?: string;
  style?: CSSProperties;
  /**
   * Row click handler (used to expand/collapse containers by clicking the row).
   * Custom wrappers should forward it to their root element so the behavior
   * survives; the handler already ignores clicks on interactive descendants.
   */
  onClick?: (event: MouseEvent) => void;
  children: ReactNode;
}

/**
 * Custom row container component (e.g. to make rows drag sources).
 *
 * Must be a stable component reference (module scope or memoized), not an
 * inline arrow: a new identity on each render is a new component type to
 * React, which remounts every row and drops in-progress editor DOM state.
 */
export type JsonTreeRowWrapper = ComponentType<JsonTreeRowWrapperProps>;

/** Props handed to a consumer-supplied code editor for object/array values. */
export interface JsonCodeEditorRenderProps {
  /** Current editor text (controlled). */
  value: string;
  /** Called with the new text on every keystroke. */
  onChange: (value: string) => void;
  /** Commit the value (bind to Ctrl/Cmd+Enter). */
  onApply: () => void;
  /** Discard the edit (bind to Escape). */
  onCancel: () => void;
  /** True when `value` does not parse as JSON. */
  invalid: boolean;
  /** Editor content language (currently always JSON). */
  language: 'json';
  /** Whether the editor should take focus on mount. */
  autoFocus: boolean;
}

/**
 * Renders the text surface for editing an object/array value as code. Omit to
 * fall back to a plain textarea. The surrounding chrome — the parse-error
 * message and the Apply/Cancel actions — is supplied by the tree, so the
 * editor only needs to render the input and wire the callbacks.
 */
export type RenderCodeEditor = (props: JsonCodeEditorRenderProps) => ReactNode;
