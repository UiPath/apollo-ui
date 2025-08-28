import type { Position } from "@xyflow/react";
import type { NodeStatusContext } from "./ExecutionStatusContext";
import type { NodeMenuItem } from "../NodeContextMenu/NodeContextMenu.types";
import type { ButtonHandleConfig, HandleActionEvent } from "../ButtonHandle/ButtonHandle";

export type NodeShape = "square" | "circle" | "rectangle";

export interface ConnectionPointConfig {
  id: string;
  label?: string;
  required?: boolean;
  position?: "top" | "right" | "bottom" | "left";
}

export interface BaseNodeData extends Record<string, unknown> {
  parameters: Record<string, unknown>; // Property bag for node-specific config

  display?: {
    label?: string;
    subLabel?: string;
    shape?: NodeShape;
    background?: string;
    iconBackground?: string;
    iconColor?: string;
  };
}

export interface NodeDisplay {
  label?: string;
  subLabel?: string;
  shape?: NodeShape;
  background?: string;
  iconBackground?: string;
  iconColor?: string;
}

export interface NodeAdornments {
  topLeft?: React.ReactNode;
  topRight?: React.ReactNode;
  bottomLeft?: React.ReactNode;
  bottomRight?: React.ReactNode;
}

export interface HandleConfiguration {
  position: Position;
  handles: ButtonHandleConfig[];
  visible?: boolean;
}

export interface NodeTypeDefinition {
  getIcon?: (data: BaseNodeData, context: NodeStatusContext) => React.ReactNode;
  getDisplay?: (data: BaseNodeData, context: NodeStatusContext) => NodeDisplay;
  getAdornments?: (data: BaseNodeData, context: NodeStatusContext) => NodeAdornments;
  getHandleConfigurations?: (data: BaseNodeData, context: NodeStatusContext) => HandleConfiguration[];
  getMenuItems?: (data: BaseNodeData, context: NodeStatusContext) => NodeMenuItem[];

  validateParameters?: (parameters: Record<string, unknown>) => boolean;
  getDefaultParameters?: () => Record<string, unknown>;

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
