import type { Position } from "@uipath/uix/xyflow/react";
import type { ButtonHandleConfig, HandleActionEvent } from "../ButtonHandle/ButtonHandle";
import type { NodeToolbarConfig } from "../NodeToolbar/NodeToolbar.types";

export type NodeShape = "square" | "circle" | "rectangle";

export interface NewBaseNodeData extends Record<string, unknown> {
  parameters?: Record<string, unknown>;
}

export interface NewBaseNodeDisplayProps {
  disabled?: boolean;
  executionStatus?: string;
  icon?: React.ReactNode;
  display?: NodeDisplay;
  adornments?: NodeAdornments;
  handleConfigurations?: HandleConfiguration[];
  toolbarConfig?: NodeToolbarConfig;
  onHandleAction?: (event: HandleActionEvent) => void;
  showHandles?: boolean;
  showAddButton?: boolean;
  shouldShowAddButtonFn?: ({ showAddButton, selected }: { showAddButton: boolean; selected: boolean }) => boolean;
}

export interface NodeDisplay {
  label?: string;
  subLabel?: string;
  labelTooltip?: string;
  labelBackgroundColor?: string;
  shape?: NodeShape;
  background?: string;
  iconBackground?: string;
  iconColor?: string;
}

export interface NodeAdornment {
  icon?: React.ReactNode;
  tooltip?: React.ReactNode;
}

export interface NodeAdornments {
  topLeft?: NodeAdornment;
  topRight?: NodeAdornment;
  bottomLeft?: NodeAdornment;
  bottomRight?: NodeAdornment;
}

export interface HandleConfiguration {
  position: Position;
  handles: ButtonHandleConfig[];
  visible?: boolean;
}
