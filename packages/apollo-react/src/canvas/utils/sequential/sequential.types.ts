/**
 * Sequential Canvas View — frozen contracts.
 *
 * These are the data shapes shared by the projection/layout engine, the
 * bar visuals, the connector/insert pipeline, and the canvas
 * assembly. They are intentionally renderer-agnostic: the projection is
 * a pure derivation of the canonical `nodes`/`edges` graph, and the flow-view
 * positions remain the persisted truth.
 *
 * Binding design decisions:
 *  D1  New `view` axis (CanvasView = 'flow' | 'sequential'); never touches
 *      BaseCanvasProps.mode, CanvasMode, or AgentFlowProps.mode.
 *  D2  Bar is a BaseNode render variant chosen by a component prop
 *      (renderVariant?: 'card' | 'bar'), not by wire schema or node data.
 *  D3  No trailing slot added to BaseNodeOverrideConfig; the bar's right-aligned
 *      group renders inside BaseNode's bar branch from the existing resolvers.
 *  D4  Positions are never written back; sequential-only inserts are stamped
 *      data.seqInserted + crypto.randomUUID() and placed by
 *      synthesizePositionsForFlow() on toggle-to-flow.
 *  D5  Insert rides the existing AddNodeManager pipeline (never forks it);
 *      free-form position stripped; sequential node types go in ignoredNodeTypes.
 *  D6  Collapse is view-local via controlled collapsedStepIds; never node.hidden.
 *  D7  Step numbers are assigned before collapse filtering, as one flat
 *      pre-order counter; synthetic rows (start bar, placeholder) are unnumbered.
 *  D8  Accessibility is a v1 feature; SequentialCanvas sets
 *      onlyRenderVisibleElements={false} so DOM order equals reading order.
 *  D9  Degrade, never hard-fail; every non-representable shape (multi-root,
 *      unstructured merge, cycle, orphan) still renders something rather than
 *      crashing or dropping a node.
 *  D10 Pure mutation ops (insertAtSlot / removeStep / moveStep -> GraphChangeSet)
 *      are the internal semantic core; the public API stays onNodesChange /
 *      onEdgesChange.
 *  D11 Toggle is an in-place array swap on the same mounted BaseCanvas (no key
 *      remount) with fitView({ duration: 300 }) and per-view viewport save/restore.
 *  D12 projectSequence memoizes on a structural fingerprint (sequenceFingerprint);
 *      data-only changes reuse the cached projection and positions.
 *  D13 SequentialCanvas stays out of components/index.ts until GA; types export
 *      first, component last.
 *  D14 Repo standards: Tailwind literals via apollo-wind only, lingui
 *      sequential-canvas.* ids, no em dash in story copy, colocated vitest tests.
 */

import type { Edge, Node, Rect, XYPosition } from '@uipath/apollo-react/canvas/xyflow/react';
import type { Waypoint } from '../../components/Edges/shared/types';

/** View axis, orthogonal to every existing `mode` (D1). */
export type CanvasView = 'flow' | 'sequential';

/** A single row of the sequential projection, in pre-order. */
export interface SequenceRow {
  nodeId: string;
  /**
   * Flat pre-order number, assigned BEFORE collapse filtering (D7). Absent on
   * synthetic rows (start bar, placeholder).
   */
  stepNumber?: number;
  /** Indent level; layout uses `x = depth * SEQ_INDENT_PX`. */
  depth: number;
  /** Owning container or branch row, if any. */
  parentRowId?: string;
  /** Branch metadata for rows that open a labeled lane ("Then"/"Else"/"Body"). */
  branch?: { sourceNodeId: string; handleId: string; label: string };
  /** True for containers and branch owners. */
  collapsible: boolean;
  collapsed: boolean;
  /** False when hidden by a collapsed ancestor. */
  visible: boolean;
  /** True for a disconnected node rendered in the trailing orphan section. */
  orphan?: boolean;
  /**
   * Terminal non-container row with no forward sequence continuation. Nested
   * leaves are followed by a full-width lane placeholder; the top-level tail is
   * served by the canvas's terminal placeholder.
   */
  isLeaf?: boolean;
  /**
   * Set on a synthetic empty-branch-lane placeholder row (a parent node's
   * declared branch handle with no child yet). The row renders as a dashed
   * "+ Add step" bar; the carried slot appends the first node into that lane
   * with the correct source handle + containment. Such rows have no canonical
   * node and are never numbered, forwarded, or keyboard-focused.
   */
  lanePlaceholder?: InsertionSlot;
}

/** An insertion point between two endpoints (graft: hybrid). */
export interface InsertionSlot {
  id: string;
  /** Endpoints the new node splices between. */
  source?: { nodeId: string; handleId?: string };
  target?: { nodeId: string; handleId?: string };
  /** Edge being split, if any. */
  graphEdgeId?: string;
  /** parentId for the inserted node. */
  containerId?: string;
}

export type SequenceConnectorKind = 'step' | 'branch-entry' | 'merge-back' | 'goto';

export interface SequenceConnector {
  id: string;
  kind: SequenceConnectorKind;
  sourceRowId: string;
  targetRowId: string;
  /** Resolved branch label. */
  label?: string;
  /** Present iff insertable; `goto` connectors carry none. */
  slot?: InsertionSlot;
}

/** The complete, stateless derivation of a graph into sequential form. */
export interface SequenceProjection {
  /** Rows in pre-order. */
  rows: SequenceRow[];
  connectors: SequenceConnector[];
  /** Includes empty-branch-body slots. */
  slots: InsertionSlot[];
}

/**
 * Options for {@link projectSequence}. Named form of the inline option shape.
 */
export interface ProjectSequenceOptions {
  /**
   * Defaults to `defaultIsSequenceEdge` (graph-helpers.ts), which counts every
   * non-preview edge as a sequence edge: this pure layer has no manifest
   * registry access, so it cannot resolve `handleType === 'artifact'` the way
   * `utils/container.ts:766`'s `isSequenceEdge` does. Callers with registry
   * access (e.g. the agent-flow consumer) must pass a registry-aware predicate
   * to exclude artifact/resource handles; otherwise those edges are traversed
   * as forward steps.
   */
  isSequenceEdge?: (edge: Edge) => boolean;
  /** Start/trigger nodes are represented by the synthetic Workflow start row. */
  isStartNode?: (node: Node) => boolean;
  /** Manifest-aware container predicate, needed to preserve empty container bodies. */
  isContainerNode?: (node: Node) => boolean;
  resolveBranchLabel?: (nodeId: string, handleId: string) => string;
  /**
   * Manifest-driven branch lanes for a parent node (If → then/else, while →
   * body, try/catch → try/catch/finally). Returns the node's declared branch
   * source handles (NOT the continuation/default source), so the projection can
   * render every lane — including empty ones as "+ Add step" placeholders —
   * before any child edge exists. Returns [] for non-parent nodes. Registry-less
   * callers omit it and get the legacy edge-count branch discovery only.
   */
  getBranchHandles?: (node: Node) => { id: string; label: string }[];
  collapsedStepIds?: ReadonlySet<string>;
}

/**
 * Options for {@link layoutSequence}. Named form of the inline option shape.
 */
export interface LayoutSequenceOptions {
  barWidth?: number;
  barHeight?: number;
  rowGap?: number;
  indent?: number;
}

/**
 * Geometry produced by {@link layoutSequence}. Named return shape so the gutter
 * and assembly can reference it.
 */
export interface SequenceLayout {
  positions: Map<string, XYPosition>;
  connectorWaypoints: Map<string, Waypoint[]>;
  bounds: Rect;
}

/**
 * Pure result of a mutation op (D10). The public canvas API stays
 * onNodesChange / onEdgesChange; these ops feed the insert/delete wiring
 * internally.
 */
export interface GraphChangeSet {
  addNodes: Node[];
  addEdges: Edge[];
  removeNodeIds: string[];
  removeEdgeIds: string[];
}
