import { ReactNode } from "react";

export interface BaseNodeData {
  icon?: ReactNode;
  label?: string;
  subLabel?: string;
  topLeftAdornment?: ReactNode;
  topRightAdornment?: ReactNode;
  bottomRightAdornment?: ReactNode;
  bottomLeftAdornment?: ReactNode;
}
