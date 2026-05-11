import type { Node, NodeProps } from '@uipath/apollo-react/canvas/xyflow/react';
import type { SuggestionType } from '../../types';
import type { ElementStatusValues } from '../../types/execution';
import type { BaseNodeData } from '../BaseNode';
import type { NodeAdornments } from '../BaseNode/BaseNode.types';
import type { NodeToolbarConfig } from '../Toolbar';

export type LoopNodeData = BaseNodeData;

export interface LoopNodeResizeSize {
  width: number;
  height: number;
}

export interface LoopIterationState {
  activeIndex: number;
  total: number;
  onActiveIndexChange?: (nextIndex: number) => void;
  disabled?: boolean;
  ariaLabel?: string;
}

export interface LoopNodeConfig {
  toolbarConfig?: NodeToolbarConfig | null;
  adornments?: NodeAdornments;
  executionStatusOverride?: ElementStatusValues;
  suggestionType?: SuggestionType;
  iterationState?: LoopIterationState;
}

export interface LoopNodeProps extends NodeProps<Node<LoopNodeData>>, LoopNodeConfig {
  onAddFirstChild?: () => void;
  onResize?: (size: LoopNodeResizeSize) => void;
}
