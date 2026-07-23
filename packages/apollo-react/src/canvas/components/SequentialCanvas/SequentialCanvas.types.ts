import type {
  Edge,
  EdgeTypes,
  Node,
  NodeTypes,
  OnEdgesChange,
  OnNodesChange,
} from '@uipath/apollo-react/canvas/xyflow/react';
import type { Ref } from 'react';
import type { CanvasView, LayoutSequenceOptions } from '../../utils/sequential/sequential.types';
import type { AddNodeManagerProps } from '../AddNodePanel/AddNodeManager';
import type { BaseCanvasProps, BaseCanvasRef } from '../BaseCanvas/BaseCanvas.types';

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
  /** Controlled, view-local collapse state (D6). */
  collapsedStepIds?: string[];
  onCollapsedStepIdsChange?: (ids: string[]) => void;
  /** Primary keyboard action invoked by Enter on the selected step. */
  onPrimaryAction?: (nodeId: string) => void;
  /** "Add trigger" button on the start bar. */
  onAddTrigger?: () => void;
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
