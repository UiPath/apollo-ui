import type { ReactNode } from 'react';

/**
 * How an element differs between the two sides of a diff. `applyDiffHighlight` maps it to the
 * canvas `SuggestionType` (`added` → `add`, `changed` → `update`, `removed` → `delete`).
 */
export type ChangeKind = 'added' | 'removed' | 'changed';

/** Which side of the diff a pane renders. */
export type DiffSide = 'before' | 'after';

export interface DiffGraph<Node, Edge> {
  nodes: Node[];
  edges: Edge[];
  /** Opaque per-side data the product's pane or panel reads (e.g. the parsed document). Passed through untouched. */
  data?: unknown;
}

/** Change kind per element id. Unchanged elements are absent. */
export interface DiffHighlight {
  nodeKind: Map<string, ChangeKind>;
  edgeKind: Map<string, ChangeKind>;
}

/** Counts per change kind, split into nodes and edges. */
export interface DiffSummary {
  addedNodes: number;
  removedNodes: number;
  changedNodes: number;
  addedEdges: number;
  removedEdges: number;
  changedEdges: number;
}

/**
 * A labelled slice of the change, e.g. "Applied this turn" and "Pending approval". Each phase
 * has the same highlight and summary shape as the whole model, so the header shows one row
 * of counts per phase and a custom pane can style each phase's elements.
 */
export interface ChangePhase {
  /** Stable id, e.g. `'applied'` or `'pending'`. Exposed as `data-change-phase`. */
  id: string;
  label: string;
  highlight: DiffHighlight;
  summary: DiffSummary;
}

/**
 * What {@link CanvasDiffView} shows. Structural, so a headless differ (e.g. `diffById`) can
 * produce it without depending on this package.
 */
export interface DiffModel<Node, Edge> {
  before: DiffGraph<Node, Edge>;
  after: DiffGraph<Node, Edge>;
  highlight: DiffHighlight;
  summary: DiffSummary;
  /** When given, the header shows counts per phase instead of one overall row. */
  changePhases?: ChangePhase[];
}

/** Pan/zoom state shared between panes. Structurally equal to xyflow's `Viewport`. */
export interface DiffViewport {
  x: number;
  y: number;
  zoom: number;
}

/** Everything one pane needs to render its side. Passed to `renderPane` and `panelSlot`. */
export interface DiffPaneContext<Node, Edge> {
  side: DiffSide;
  nodes: Node[];
  edges: Edge[];
  /** This side's `DiffGraph.data`, untouched. */
  data?: unknown;
  /** Changes visible on this side: removed only before, added only after, changed on both. */
  highlight: DiffHighlight;
  /** The model's phases, each with its highlight filtered to this side. */
  changePhases?: ChangePhase[];
  selectedNodeId?: string;
  onSelectNode(id: string | undefined): void;
  /** Shared viewport. `undefined` until a pane reports one, or when sync is off. */
  viewport?: DiffViewport;
  /**
   * Whether to fit the graph when the pane mounts. False once a shared viewport exists, and
   * for the follower pane while viewports are synced: it adopts the leader's fit, so two
   * mount-time fits never race. The leader is the after pane, or the before pane when the
   * after graph is empty and the before graph is not.
   */
  fitViewOnMount: boolean;
  /** Report a user pan/zoom so the other pane follows. No-op when sync is off. */
  onViewportChange(viewport: DiffViewport): void;
}

/** `horizontal` puts the panes side by side, `vertical` stacks them. */
export type CanvasDiffViewOrientation = 'horizontal' | 'vertical';

export interface CanvasDiffViewSelection {
  selectedNodeId: string | undefined;
  onChange(id: string | undefined): void;
}

export interface CanvasDiffViewProps<Node, Edge> {
  /** Memoize it: a new model starts a fresh review (selection, viewport and panes reset). */
  model: DiffModel<Node, Edge>;
  /**
   * Renders one side's canvas; called once per visible pane. Use `ApolloCanvasDiffPane` for a
   * `BaseCanvas` product, or your own canvas (see the "Custom pane" story).
   */
  renderPane(ctx: DiffPaneContext<Node, Edge>): ReactNode;
  /** Optional side content (e.g. a properties panel) rendered beside its pane. */
  panelSlot?(ctx: DiffPaneContext<Node, Edge>): ReactNode;
  /**
   * Alternate code view. The visual/code toggle appears only when given. Pass
   * `<CodeDiffView before={…} after={…} />` for a side-by-side line diff of the serialized graphs.
   */
  codeView?: ReactNode;
  /** Extra controls rendered at the end of the header. */
  headerActions?: ReactNode;
  title?: string;
  /** Heading level of the title, to fit the host page outline. @default 2 */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  /** Shows a Keep button. Omit both `onKeep` and `onRevert` for a read-only preview. */
  onKeep?(): void;
  /** Shows a Revert button. */
  onRevert?(): void;
  keepLabel?: string;
  revertLabel?: string;
  /** When false, only the after pane renders. @default true */
  showBefore?: boolean;
  /** Controlled orientation. Uncontrolled default is `vertical` (stacked). */
  orientation?: CanvasDiffViewOrientation;
  onOrientationChange?(orientation: CanvasDiffViewOrientation): void;
  /** Controlled selection shared by both panes; the host resets it for a new model. */
  selection?: CanvasDiffViewSelection;
  /** Pan and zoom both panes together. @default true */
  syncViewport?: boolean;
  className?: string;
}
