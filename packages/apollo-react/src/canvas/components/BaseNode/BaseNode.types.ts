import { ReactNode } from "react";
import { Position } from "@xyflow/react";
import { ButtonHandleConfig } from "../ButtonHandle/ButtonHandle";
import { NodeMenuItem } from "../NodeContextMenu/NodeContextMenu.types";

export type NodeShape = "square" | "circle" | "rectangle";

export interface HandleConfiguration {
  position: Position;
  handles: ButtonHandleConfig[];
  visible?: boolean;
}

export interface SingleHandleConfiguration {
  position: Position;
  handle: ButtonHandleConfig;
  visible?: boolean;
}

export interface BaseNodeData extends Record<string, any> {
  icon?: ReactNode;
  label?: string;
  subLabel?: string;
  topLeftAdornment?: ReactNode;
  topRightAdornment?: ReactNode;
  bottomRightAdornment?: ReactNode;
  bottomLeftAdornment?: ReactNode;
  handleConfigurations?: HandleConfiguration[] | SingleHandleConfiguration[];
  shape?: NodeShape;
  menuItems?: NodeMenuItem[];
}

// ArtifactNode specific data type that enforces single handles
export interface ArtifactNodeData extends Omit<BaseNodeData, "handleConfigurations" | "shape"> {
  handleConfigurations?: SingleHandleConfiguration[];
  shape?: "circle"; // Always circle for artifacts
}
