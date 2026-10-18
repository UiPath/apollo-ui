/**
 * Sequential canvas view contracts, shared by the projection/layout engine, the bar
 * renderers, the insert pipeline and the canvas assembly. Renderer-agnostic: the
 * projection is a pure derivation of `nodes`/`edges`; flow positions stay the
 * persisted truth and are never written back.
 */

import type { Edge, Node, Rect, XYPosition } from '@uipath/apollo-react/canvas/xyflow/react';
import type { Waypoint } from '../../components/Edges/shared/types';

/** View axis, orthogonal to every existing `mode`. */
export type CanvasView = 'flow' | 'sequential';

/** A single row of the sequential projection, in pre-order. */
export interface SequenceRow {
  nodeId: string;
  /** Flat pre-order number, assigned before collapse filtering. Absent on synthetic rows. */
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
  /** Terminal non-container row with no forward sequence continuation. */
  isLeaf?: boolean;
  /**
   * Set on a synthetic add-step row (empty lane/body, or the trailing add point of a
   * populated lane). The slot appends into that scope. Such rows have no canonical
   * node and are never numbered, forwarded, or keyboard-focused.
   */
  lanePlaceholder?: InsertionSlot;
  /** 'lane' renders as the dashed "Add step" row; 'append' as the quiet plus used between steps. */
  placeholderKind?: 'lane' | 'append';
}

/** An insertion point between two endpoints. */
export interface InsertionSlot {
  id: string;
  source?: { nodeId: string; handleId?: string };
  target?: { nodeId: string; handleId?: string };
  /** Edge being split, if any. */
  graphEdgeId?: string;
  /** parentId for the inserted node. */
  containerId?: string;
  /** The split edge is an explicit spine continuation, not branch/body content. */
  continuation?: boolean;
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

/** Options for {@link projectSequence}. */
export interface ProjectSequenceOptions {
  /**
   * Defaults to treating every non-preview edge as a sequence edge. This layer has
   * no registry access, so callers must pass a registry-aware predicate to exclude
   * artifact/resource handles, or those edges are traversed as forward steps.
   */
  isSequenceEdge?: (edge: Edge) => boolean;
  /** Start/trigger nodes are represented by the synthetic Workflow start row. */
  isStartNode?: (node: Node) => boolean;
  /** Manifest-aware container predicate, needed to preserve empty container bodies. */
  isContainerNode?: (node: Node) => boolean;
  resolveBranchLabel?: (nodeId: string, handleId: string) => string;
  /**
   * Declared branch source handles for a parent node (not the continuation source),
   * so empty lanes render as placeholders before any child edge exists. Returns []
   * for non-parent nodes. Without it only edge-count branch discovery runs.
   */
  getBranchHandles?: (node: Node) => { id: string; label: string }[];
  collapsedStepIds?: ReadonlySet<string>;
}

/** Options for {@link layoutSequence}. */
export interface LayoutSequenceOptions {
  barWidth?: number;
  barHeight?: number;
  rowGap?: number;
  indent?: number;
}

/** Geometry produced by {@link layoutSequence}. */
export interface SequenceLayout {
  positions: Map<string, XYPosition>;
  connectorWaypoints: Map<string, Waypoint[]>;
  bounds: Rect;
}

/** Result of a pure mutation op, applied by the caller through onNodesChange / onEdgesChange. */
export interface GraphChangeSet {
  addNodes: Node[];
  addEdges: Edge[];
  removeNodeIds: string[];
  removeEdgeIds: string[];
}
