import type { Edge, EdgeProps } from '@uipath/apollo-react/canvas/xyflow/react';
import type {
  InsertionSlot,
  SequenceConnectorKind,
} from '../../../utils/sequential/sequential.types';
import type { Waypoint } from '../../Edges/shared/types';

/**
 * Where an insert slot sits, in step numbers rather than coordinates. `before` is
 * for a gap under an unnumbered source (the start bar); `branch` names both the
 * lane and its owning step so two `Then` lanes stay distinguishable.
 */
export type SequentialInsertAnchor =
  | { kind: 'after'; stepNumber: number }
  | { kind: 'before'; stepNumber: number }
  | { kind: 'branch'; stepNumber: number; branchLabel: string };

/**
 * Reference-stable `data` for a sequential connector edge. Rebuild it only on
 * structural change: `areEdgePropsEqual` compares `data` by reference.
 * A `type`, not an `interface`, to satisfy xyflow's `Edge<T extends Record>` constraint.
 */
export type SequentialConnectorData = {
  kind: SequenceConnectorKind;
  /** Branch-entry labels render as a header above the lane; other kinds use the centered pill. */
  label?: string | null;
  /** Elbows from `layoutSequence`, rendered verbatim. Reuse one reference (EMPTY_WAYPOINTS) when empty. */
  waypoints?: Waypoint[];
  /** The ⊕ renders only when this is set and the canvas is in design mode. */
  slot?: InsertionSlot;
  /** Set whenever `slot` is set; builds the ⊕'s accessible name from step numbers. */
  insertAnchor?: SequentialInsertAnchor;
  /** Transient Add Node connector: selected color + dashed preview stroke. */
  preview?: boolean;
  /** Visual-only preview join that AddNodeManager must not materialize. */
  ignorePreviewConnection?: boolean;
  /**
   * Canonical manifest handle on the existing endpoint of a preview edge.
   * The rendered edge stays on the guaranteed sequential bar handle while
   * AddNodeManager uses this id for connection filtering and materialization.
   */
  previewConnectionHandleId?: string;
  enableExecution?: boolean;
  hideArrowHead?: boolean;
};

/** The xyflow edge shape rendered by {@link SequentialConnectorEdge}. */
export type SequentialConnectorEdgeType = Edge<SequentialConnectorData>;

/** Props xyflow hands the edge component. */
export type SequentialConnectorEdgeProps = EdgeProps<SequentialConnectorEdgeType>;
