import type { Node, NodeProps } from '@uipath/apollo-react/canvas/xyflow/react';
import type { ElementStatusValues } from '../../types/execution';
import type { BaseNodeData } from '../BaseNode';
import type {
  ContainerNodeConfig,
  ContainerNodeResizeSize,
} from '../ContainerNode/ContainerNode.types';

export type LoopNodeData = BaseNodeData;

export type LoopNodeResizeSize = ContainerNodeResizeSize;

export interface LoopNodeExecutionCountState {
  activeIndex: number;
  total: number;
  onActiveIndexChange?: (nextIndex: number) => void;
  disabled?: boolean;
  isAll: boolean;
  onAllChange: (isAll: boolean) => void;
  iterationStatuses?: Map<number, ElementStatusValues>;
}

export interface LoopNodeConfig extends ContainerNodeConfig {
  /** Execution counter shown in the header. Ignored when `headerEnd` is passed. */
  iterationPillState?: LoopNodeExecutionCountState;
}

export interface LoopNodeProps extends NodeProps<Node<LoopNodeData>>, LoopNodeConfig {
  onAddFirstChild?: () => void;
  onResize?: (size: LoopNodeResizeSize) => void;
  onResizeStart?: () => void;
  onResizeEnd?: () => void;
}
