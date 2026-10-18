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
  /** Controlled, view-local collapse state. */
  collapsedStepIds?: string[];
  onCollapsedStepIdsChange?: (ids: string[]) => void;
  /** Invoked by Enter on the selected step. */
  onPrimaryAction?: (nodeId: string) => void;
  /** "Add trigger" button on the synthetic start bar (sequential view only). */
  onAddTrigger?: () => void;
  /**
   * Options for the Add Node panel this canvas mounts in sequential design mode. Ignored in
   * flow view, where the host renders its own AddNodeManager through `children`.
   */
  addNodeManagerProps?: Partial<AddNodeManagerProps>;
  canvasRef?: Ref<BaseCanvasRef<N, E>>;
}

/** Controlled segmented flow/sequential control. */
export interface ViewSwitcherProps {
  value: CanvasView;
  onChange: (view: CanvasView) => void;
}
