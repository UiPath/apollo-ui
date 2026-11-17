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
 * Props for the sequential view: a curated subset of BaseCanvasProps plus the standard
 * onNodesChange / onEdgesChange, with synthetic rows filtered out before those fire.
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
    | 'readOnlyNodeIds'
  > {
  /** Canonical graph; flow-view positions are never written. */
  nodes: N[];
  edges: E[];
  /** Flow graph or sequential projection, switched without remounting BaseCanvas. */
  view?: CanvasView;
  /** Sequential-view geometry overrides. */
  sequenceLayoutOptions?: LayoutSequenceOptions;
  /** Which canonical nodes enter the sequential projection; sticky notes are excluded by default. */
  isSequenceNode?: (node: N) => boolean;
  /** Node registrations used while `view="flow"`. */
  flowNodeTypes?: NodeTypes;
  /** Flow edge registrations merged over the standard `SequenceEdge` default. */
  flowEdgeTypes?: EdgeTypes;
  /** Synthetic rows are filtered out before forwarding. */
  onNodesChange?: OnNodesChange<N>;
  onEdgesChange?: OnEdgesChange<E>;
  /**
   * View-local collapse state, for the whole-canvas sequence and for sequenced container
   * bodies. Held internally when `onCollapsedStepIdsChange` is absent.
   */
  collapsedStepIds?: string[];
  onCollapsedStepIdsChange?: (ids: string[]) => void;
  /** Invoked by Enter on the selected step. */
  onPrimaryAction?: (nodeId: string) => void;
  /**
   * "Add trigger" on a synthetic start row, design mode only. Called without an argument
   * from the whole-canvas sequential view, and with the container id from the start row of
   * a self-contained (runtime) container body shown as a sequence on a flow canvas.
   */
  onAddTrigger?: (containerId?: string) => void;
  /**
   * Options for the Add Node panel this canvas mounts in design mode: always in sequential
   * view, and in flow view while any container is sequenced. Otherwise the host renders its
   * own AddNodeManager through `children`.
   */
  addNodeManagerProps?: Partial<AddNodeManagerProps>;
  /**
   * Flow-view containers whose body renders as a sequence inside the frame (view state, not
   * node data). Children of such a container are not draggable; the frame is the unit that
   * moves. Omit the callback to let the canvas own this state internally.
   */
  sequencedContainerIds?: string[];
  onSequencedContainerIdsChange?: (ids: string[]) => void;
  canvasRef?: Ref<BaseCanvasRef<N, E>>;
}

/** Controlled segmented flow/sequential control. */
export interface ViewSwitcherProps {
  value: CanvasView;
  onChange: (view: CanvasView) => void;
}
