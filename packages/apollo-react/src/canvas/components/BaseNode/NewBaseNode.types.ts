import type { Position } from "@xyflow/react";
import type { NodeMenuItem } from "../NodeContextMenu/NodeContextMenu.types";
import type { ButtonHandleConfig, HandleActionEvent } from "../ButtonHandle/ButtonHandle";

export type NodeShape = "square" | "circle" | "rectangle";

export interface NewBaseNodeData extends Record<string, unknown> {
  parameters?: Record<string, unknown>;
}

export interface NewBaseNodeDisplayProps {
  executionStatus?: string;
  icon?: React.ReactNode;
  display?: NodeDisplay;
  adornments?: NodeAdornments;
  handleConfigurations?: HandleConfiguration[];
  menuItems?: NodeMenuItem[];
  onHandleAction?: (event: HandleActionEvent) => void;
  showAddButton?: boolean;
}

export interface NodeDisplay {
  label?: string;
  subLabel?: string;
  labelBackgroundColor?: string;
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
