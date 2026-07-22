import type { Edge, EdgeProps } from '@uipath/apollo-react/canvas/xyflow/react';
import type {
  InsertionSlot,
  SequenceConnectorKind,
} from '../../../utils/sequential/sequential.types';
import type { Waypoint } from '../../Edges/shared/types';

/**
 * Reference-stable `data` payload for a sequential connector edge.
 *
 * The assembly builds one of these per {@link SequenceConnector} when it derives the
 * xyflow edge array (see useSequentialGraph). The object MUST be built only on
 * structural change and reused by reference otherwise, so `areEdgePropsEqual`
 * (which compares `data` by reference, see components/Edges/shared/areEdgePropsEqual.ts)
 * can short-circuit the memo during pan/zoom and data-only edits (D12).
 *
 * Field-by-field contract:
 *  - `kind`            copy from `connector.kind`. Drives stroke style: `step`
 *                      `branch-entry`, and `merge-back` render solid; only
 *                      irregular `goto` references render dashed. See
 *                      {@link resolveConnectorStrokeStyle}.
 *  - `label`           copy from `connector.label`. Branch-entry labels render
 *                      above their first row using the shared edge-label style;
 *                      other kinds
 *                      retain the centered edge pill. Omit or use an empty
 *                      string to render no label.
 *  - `waypoints`       elbow geometry from `layoutSequence().connectorWaypoints`
 *                      keyed by the connector id. Rendered verbatim (no router,
 *                      no editing). When absent, the edge draws a clean
 *                      orthogonal path between the two handle anchors. Reuse the
 *                      SAME array reference across renders; a fresh `[]` each
 *                      render defeats geometry memoization (prefer the shared
 *                      EMPTY_WAYPOINTS fallback).
 *  - `slot`            copy from `connector.slot`. The centered insert (+)
 *                      button renders IFF this is present AND the canvas is in
 *                      design mode. `goto` connectors carry no slot and so get
 *                      no button.
 *  - `enableExecution` opt in to id-keyed execution coloring + the in-progress
 *                      dot, via the existing ExecutionStatusContext. Defaults to
 *                      off; turning it on matches CanvasEdge behavior.
 *  - `hideArrowHead`   suppress the arrow head. Defaults to showing an arrow
 *                      pointing into the target for every kind.
 */
// A `type` (not an `interface`) so it implicitly satisfies xyflow's
// `Edge<T extends Record<string, unknown>>` constraint, matching CanvasEdgeData.
export type SequentialConnectorData = {
  kind: SequenceConnectorKind;
  label?: string | null;
  waypoints?: Waypoint[];
  slot?: InsertionSlot;
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
