import type { Node, NodeProps } from '@uipath/apollo-react/canvas/xyflow/react';
import type { BaseNodeData } from '../BaseNode';

export type LoopNodeData = BaseNodeData;

export interface LoopNodeProps extends NodeProps<Node<LoopNodeData>> {
  onAddFirstChild?: () => void;
  onResize?: (size: { width: number; height: number }) => void;
}
