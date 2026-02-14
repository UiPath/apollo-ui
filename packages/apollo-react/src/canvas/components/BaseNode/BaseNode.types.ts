import type { NodeShape } from '../../schema';
import type { ExecutionState } from '../../types/execution';

export type FooterVariant = 'none' | 'button' | 'single' | 'double';

export interface BaseNodeData extends Record<string, unknown> {
  display?: {
    label?: string;
    subLabel?: string;
    shape?: NodeShape;
    color?: string;
    background?: string;
    icon?: string;
    iconBackground?: string;
    iconBackgroundDark?: string;
    iconColor?: string;
  };

  /**
   * When true, uses SmartHandle instead of ButtonHandle for dynamic handle positioning.
   * SmartHandle positions handles based on connected node locations.
   * @default false
   */
  useSmartHandles?: boolean;

  /**
   * Whether the node is collapsed.
   * @default false
   */
  isCollapsed?: boolean;
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
