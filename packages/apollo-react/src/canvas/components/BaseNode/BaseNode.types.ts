import type { Position } from '@uipath/apollo-react/canvas/xyflow/react';
import type { ExecutionState } from '../../types/execution';
import type { ButtonHandleConfig, HandleActionEvent } from '../ButtonHandle/ButtonHandle';
import type { NodeMenuItem } from '../NodeContextMenu/NodeContextMenu.types';
import type { NodeToolbarConfig } from '../Toolbar';

export type NodeShape = 'square' | 'circle' | 'rectangle';

export interface ConnectionPointConfig {
  id: string;
  label?: string;
  required?: boolean;
  position?: 'top' | 'right' | 'bottom' | 'left';
}

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

export interface NodeDisplay {
  label?: string;
  subLabel?: string;
  labelTooltip?: string;
  labelBackgroundColor?: string;
  shape?: NodeShape;
  background?: string;
  color?: string;
  iconBackground?: string;
  iconColor?: string;
  /** Custom content to render in the center text container, below label and subLabel */
  centerAdornmentComponent?: React.ReactNode;
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

export interface HandleConfigurationSpecificPosition {
  /**
   * The height of the area where the handles will be located in the node. Has no effect if no top or bottom is set.
   */
  height?: number;

  /**
   * The width of the area where the handles will be located in the node. Has no effect if no left or right is set.
   */
  width?: number;

  /**
   * The top offset of where the node handles should be placed
   */
  top?: number;

  /**
   * The bottom offset of where the node handles should be placed
   */
  bottom?: number;

  /**
   * The left offset of where the node handles should be placed
   */
  left?: number;

  /**
   * The right offset of where the node handles should be placed
   */
  right?: number;
}

export interface HandleConfiguration {
  position: Position;
  handles: ButtonHandleConfig[];
  visible?: boolean;
  customPositionAndOffsets?: HandleConfigurationSpecificPosition;
}

export interface BaseItem {
  id: string;
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}

export interface NodeTypeDefinition {
  getIcon?: (data: BaseNodeData, context: NodeStatusContext) => React.ReactNode;
  getDisplay?: (data: BaseNodeData, context: NodeStatusContext) => NodeDisplay;
  getAdornments?: (data: BaseNodeData, context: NodeStatusContext) => NodeAdornments;
  getHandleConfigurations?: (
    data: BaseNodeData,
    context: NodeStatusContext
  ) => HandleConfiguration[];
  getMenuItems?: (data: BaseNodeData, context: NodeStatusContext) => NodeMenuItem[];
  getToolbar?: (data: BaseNodeData, context: NodeStatusContext) => NodeToolbarConfig | undefined;

  validateParameters?: (parameters: Record<string, unknown>) => boolean;
  getDefaultParameters?: () => Record<string, unknown>;

  // FIXME: temp for PO integration
  validateUiPathData?: (item: BaseItem) => boolean;
  getUiPathData?: (item: BaseItem) => Record<string, unknown>;

  // Handle action handler - optional per node type
  onHandleAction?: (event: HandleActionEvent) => void;
}

export interface NodeRegistration {
  nodeType: string;
  subType?: string;
  definition: NodeTypeDefinition;

  // Metadata for node palette/selector
  category?: string;
  displayName?: string;
  description?: string;
  icon?: string | React.FC; // Icon for AddNodePanel display
  tags?: string[]; // Additional search keywords
  version?: string;
  isVisible?: boolean; // Whether to show in AddNodePanel (default: true)
  sortOrder?: number; // Display order in category (lower = higher)
}
