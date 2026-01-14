import type { ExecutionState } from '../../types/execution';

export type NodeShape = 'square' | 'circle' | 'rectangle';

export interface BaseNodeData extends Record<string, unknown> {
  parameters: Record<string, unknown>; // Property bag for node-specific config

  display?: {
    label?: string;
    subLabel?: string;
    shape?: NodeShape;
    color?: string;
    background?: string;
    icon?: string;
    iconBackground?: string;
    iconColor?: string;
  };

  /**
   * When true, uses SmartHandle instead of ButtonHandle for dynamic handle positioning.
   * SmartHandle positions handles based on connected node locations.
   * @default false
   */
  useSmartHandles?: boolean;
}

export interface NodeAdornments {
  topLeft?: React.ReactNode;
  topRight?: React.ReactNode;
  bottomLeft?: React.ReactNode;
  bottomRight?: React.ReactNode;
}

export interface NodeStatusContext {
  nodeId: string;
  executionState?: ExecutionState;
  isHovered?: boolean;
  isConnecting?: boolean;
  isSelected?: boolean;
  isDragging?: boolean;
}
