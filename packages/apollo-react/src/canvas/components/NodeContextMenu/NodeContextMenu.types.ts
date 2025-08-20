import type { ReactNode } from "react";

export interface NodeMenuAction {
  id: string;
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

export interface NodeMenuDivider {
  type: "divider";
}

export type NodeMenuItem = NodeMenuAction | NodeMenuDivider;

export interface NodeContextMenuProps {
  menuItems?: NodeMenuItem[];
  isVisible?: boolean;
}
