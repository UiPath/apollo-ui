import type { Node, NodeProps } from '@uipath/apollo-react/canvas/xyflow/react';
import type { SuggestionType } from '../../types';
import type { ElementStatusValues } from '../../types/execution';
import type { BaseNodeData } from '../BaseNode';
import type { NodeAdornments } from '../BaseNode/BaseNode.types';
import type { StageHeaderChip } from '../StageNode/StageNode.types';
import type { NodeToolbarConfig } from '../Toolbar';

export type LoopNodeData = BaseNodeData;

export interface LoopNodeResizeSize {
  width: number;
  height: number;
}

export interface LoopNodeExecutionCountState {
  activeIndex: number;
  total: number;
  onActiveIndexChange?: (nextIndex: number) => void;
  disabled?: boolean;
  isAll: boolean;
  onAllChange: (isAll: boolean) => void;
  iterationStatuses?: Map<number, ElementStatusValues>;
}

export interface LoopNodeConfig {
  toolbarConfig?: NodeToolbarConfig | null;
  adornments?: NodeAdornments;
  executionStatusOverride?: ElementStatusValues;
  suggestionType?: SuggestionType;
  iterationPillState?: LoopNodeExecutionCountState;
  /**
   * Rule chips rendered in a wrapping row under the header title (entry / exit /
   * completion counts, Optional / Ends case pills). Same chip model as StageNode's
   * `stageDetails.headerChips`. Can also be supplied per-node via `data.headerChips`;
   * this prop wins when both are set.
   */
  headerChips?: StageHeaderChip[];
}

export interface LoopNodeProps extends NodeProps<Node<LoopNodeData>>, LoopNodeConfig {
  onAddFirstChild?: () => void;
  onResize?: (size: LoopNodeResizeSize) => void;
  onResizeStart?: () => void;
  onResizeEnd?: () => void;
}
