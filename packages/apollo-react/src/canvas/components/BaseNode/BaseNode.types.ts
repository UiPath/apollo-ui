import { ReactNode } from "react";
import { Position } from "@xyflow/react";
import { ButtonHandleConfig } from "../ButtonHandle/ButtonHandle";

export interface HandleConfiguration {
  position: Position;
  handles: ButtonHandleConfig[];
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
  handleConfigurations?: HandleConfiguration[];
}
