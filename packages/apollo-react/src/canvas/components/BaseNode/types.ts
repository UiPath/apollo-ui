import { Position } from "@xyflow/react";
import { NodeStatusContext } from "./ExecutionStatusContext";
import { NodeMenuItem } from "../NodeContextMenu/NodeContextMenu.types";
import { ButtonHandleConfig } from "../ButtonHandle/ButtonHandle";

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
  };
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
  getAdornments?: (data: BaseNodeData, context: NodeStatusContext) => NodeAdornments;
  getHandleConfigurations?: (data: BaseNodeData, context: NodeStatusContext) => HandleConfiguration[];
  getMenuItems?: (data: BaseNodeData, context: NodeStatusContext) => NodeMenuItem[];

  validateParameters?: (parameters: Record<string, unknown>) => boolean;
  getDefaultParameters?: () => Record<string, unknown>;
  getDefaultDisplay?: () => BaseNodeData["display"];
}

export interface NodeRegistration {
  nodeType: string;
  definition: NodeTypeDefinition;
  category?: string;
  displayName?: string;
  description?: string;
  version?: string;
}
