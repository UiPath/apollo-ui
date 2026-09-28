import type {
  Edge,
  EdgeTypes,
  Node,
  NodeTypes,
  OnEdgesChange,
  OnNodesChange,
} from '@uipath/apollo-react/canvas/xyflow/react';
import type { Ref } from 'react';
import type {
  CanvasView,
  GraphChangeSet,
  InsertionSlot,
  LayoutSequenceOptions,
} from '../../utils/sequential/sequential.types';
import type { AddNodeManagerProps } from '../AddNodePanel/AddNodeManager';
import type { BaseCanvasProps, BaseCanvasRef } from '../BaseCanvas/BaseCanvas.types';
import type { SequentialMoveDirection } from './sequentialMoveActions';

/**
 * A user-initiated structural edit in `view="sequential"`, reported by
 * `onSequentialOperation` ahead of the equivalent change batch.
 *
 * - `insert`: `node` is already re-id'd and parented (containment applied), and
 *   `edges` are the healed edges that will be added with it.
 * - `remove`: `changeSet.removeNodeIds` includes cascaded descendants.
 * - `move`: `to` is the slot after commit-time handle resolution.
 */
export type SequentialOperation<N extends Node = Node> =
  | { kind: 'insert'; slot: InsertionSlot; node: N; edges: Edge[] }
  | { kind: 'remove'; nodeId: string; changeSet: GraphChangeSet }
  | {
      kind: 'move';
      nodeId: string;
      to: InsertionSlot;
      direction: SequentialMoveDirection;
      changeSet: GraphChangeSet;
    };

/**
 * Public props for the sequential view. It renders through the existing
 * BaseCanvas, so it borrows a curated subset of BaseCanvasProps and never
 * exposes the free-form node/edge handlers directly. Mutations still flow out
 * through onNodesChange / onEdgesChange (D10); synthetic rows (start bar,
 * placeholder) are filtered out before those callbacks fire.
 */
export interface SequentialCanvasProps<N extends Node = Node, E extends Edge = Edge>
  extends Pick<
    BaseCanvasProps<N, E>,
    | 'mode'
    | 'isDarkMode'
    | 'locale'
    | 'fitViewOptions'
    | 'onToolbarAction'
    | 'breakpoints'
    | 'children'
    | 'onNodeDoubleClick'
  > {
  /** Canonical graph; flow-view positions are untouched (D4). */
  nodes: N[];
  edges: E[];
  /** Render the canonical flow graph or its sequential projection without remounting BaseCanvas. */
  view?: CanvasView;
  /** Optional sequential-view geometry overrides. Flow-view geometry is untouched. */
  sequenceLayoutOptions?: LayoutSequenceOptions;
  /**
   * Controls which canonical nodes participate in the sequential projection.
   * Excluded presentation-only nodes remain untouched and reappear in Flow.
   * Sticky notes are excluded by default.
   */
  isSequenceNode?: (node: N) => boolean;
  /** Node registrations used while `view="flow"`. */
  flowNodeTypes?: NodeTypes;
  /** Flow edge registrations merged over the standard `SequenceEdge` default. */
  flowEdgeTypes?: EdgeTypes;
  /** Synthetic rows are filtered out before forwarding. */
  onNodesChange?: OnNodesChange<N>;
  onEdgesChange?: OnEdgesChange<E>;
  /**
   * Fired once per user-initiated structural operation in `view="sequential"`, BEFORE the
   * equivalent `onNodesChange` / `onEdgesChange` batch for the same operation. Purely
   * informational: the change stream is still emitted and remains the only way state changes.
   * Hosts whose source of truth is external (e.g. a designer process) translate this
   * into their own edit commands and treat the change batch as an optimistic preview.
   */
  onSequentialOperation?: (op: SequentialOperation<N>) => void;
  /** Controlled, view-local collapse state (D6). */
  collapsedStepIds?: string[];
  onCollapsedStepIdsChange?: (ids: string[]) => void;
  /** Primary keyboard action invoked by Enter on the selected step. */
  onPrimaryAction?: (nodeId: string) => void;
  /**
   * "Add trigger" button on the start bar. Sequential-only: the start bar is a
   * synthetic row of the projection and has no counterpart in flow view.
   */
  onAddTrigger?: () => void;
  /**
   * Options for the built-in Add Node panel.
   *
   * SEQUENTIAL-ONLY, and only in `mode="design"`. This canvas mounts
   * `AddNodeManager` itself for `view="sequential"` because the insert
   * affordances (connector ⊕, lane and terminal placeholders) are projection
   * concepts that need a panel wired to a slot. In `view="flow"` no panel is
   * mounted and these options are ignored: flow-view add-node UX belongs to the
   * host, which can render its own `AddNodeManager` through `children`.
   */
  addNodeManagerProps?: Partial<AddNodeManagerProps>;
  canvasRef?: Ref<BaseCanvasRef<N, E>>;
}

/**
 * Segmented flow/sequential control. Controlled: the host owns `value` and
 * `onChange`.
 */
export interface ViewSwitcherProps {
  value: CanvasView;
  onChange: (view: CanvasView) => void;
}
