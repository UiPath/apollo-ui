import type { ReactNode } from 'react';
import type {
  CopyEvent,
  DeriveTypeIcon,
  JsonContainer,
  JsonSchema,
  JsonTreeChange,
  JsonTreeFilterOption,
  JsonTreeNode,
  JsonTreeRowWrapper,
  NodeActionsResolver,
  NodeDecoration,
  RenderCodeEditor,
  RenderValueCell,
} from '../JsonTree/JsonTree.types';

/** A consumer-provided tab rendered after the built-in Schema and JSON tabs. */
export interface NodeIOViewTab {
  /** Stable tab id. Must not collide with the built-in `schema` / `json`. */
  id: string;
  /** Label shown on the tab trigger. */
  label: string;
  /** Tab body. Rendered inside the panel's tab content area. */
  content: ReactNode;
}

export interface NodeIOViewProps {
  /** JSON Schema describing the expected structure. Optional: without it the tree is value-driven and no schema statuses are reported. */
  schema?: JsonSchema;
  /** The JSON value to display and edit. Must be an object or array (the panel renders a container's fields). */
  value?: JsonContainer;
  /** Called with the full updated value after an inline edit, plus the specific change. */
  onValueChange?: (next: JsonContainer, change: JsonTreeChange) => void;
  /**
   * Prefix prepended to every tree path (e.g. a domain-object id, so paths
   * read `httpRequest1.statusCode`). Affects displayed paths, copied paths,
   * and `JsonTreeChange.path` — but not `JsonTreeChange.segments`, which stay
   * relative to `value`.
   */
  basePath?: string;
  /** Hides all editing affordances. */
  readOnly?: boolean;
  /** Title in the panel's title bar. Omit to hide the bar. */
  title?: string;
  /** Optional icon rendered before the title. */
  titleIcon?: ReactNode;
  /** Technical identifier rendered in monospace next to the title (e.g. a node id). */
  titleBadge?: string;
  /** Right-aligned slot in the title bar (e.g. a `NodeOutputModeSelect`). */
  titleTrailing?: ReactNode;
  /** Placeholder (and aria-label) for the tree search input. Defaults to a generic message. */
  searchPlaceholder?: string;
  /** Shown when the tree has no rows and no search/filter is active. Defaults to a generic message. */
  emptyMessage?: string;
  /** Custom JSON tab content (e.g. a Monaco editor). Defaults to a read-only serialized view. */
  jsonView?: ReactNode;
  /**
   * Consumer tabs rendered after Schema and JSON (e.g. a document-extraction
   * results view in a node properties panel).
   */
  extraTabs?: NodeIOViewTab[];
  /** Initially selected tab id. Defaults to `schema`. */
  defaultTab?: string;
  /** Called when the user switches tabs (e.g. for telemetry). */
  onTabChange?: (tabId: string) => void;
  /**
   * Rendered between the tab strip and the tab content, visible on every tab
   * (e.g. a simulation-instruction editor while the node is in a mocked mode).
   */
  beforeContent?: ReactNode;
  /**
   * Custom row container for the value tree (e.g. to make rows drag sources).
   * Must be a stable component reference (module scope or memoized), not an
   * inline arrow.
   */
  rowWrapper?: JsonTreeRowWrapper;
  /** Toolbar filter options. Omit to hide the filter control. */
  filters?: JsonTreeFilterOption[];
  /** Per-node visual annotations (labels, chips, badge overrides). None by default. */
  decorateNode?: (node: JsonTreeNode) => NodeDecoration | undefined;
  /** Custom type-badge icons per node. Return undefined to keep the default type icon. */
  deriveTypeIcon?: DeriveTypeIcon;
  /** Custom value cell renderer (e.g. a file picker for `format: 'file'` nodes). */
  renderValue?: RenderValueCell;
  /**
   * Customizes the trailing row actions per node: compose with the built-ins
   * via `ctx.defaultActions`, return `[]` to omit them (e.g. per-node), or
   * `undefined` to keep the defaults.
   */
  nodeActions?: NodeActionsResolver;
  /** Max row actions shown inline before the surplus collapses into a menu. Default 3. */
  maxInlineActions?: number;
  /** Renders the object/array editing surface as a code editor (defaults to a textarea). */
  renderCodeEditor?: RenderCodeEditor;
  /**
   * Builds the text copied when a field name is clicked. Defaults to the path
   * itself; consumers with an expression syntax can wrap it (e.g. `{{path}}`).
   */
  pathForCopy?: (path: string) => string;
  /** Called after something is copied to the clipboard. */
  onCopy?: (event: CopyEvent) => void;
  /** Containers at depth >= this start collapsed. Default 2 (top two levels open). */
  defaultCollapsedDepth?: number;
  className?: string;
}
