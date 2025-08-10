import { ReactNode } from "react";
import { NodeMenuItem } from "../NodeContextMenu/NodeContextMenu.types";

export interface ProcessItem {
  id: string;
  label: string;
  icon?: ReactNode;
  status?: "active" | "completed" | "pending";
}

export interface StageNodeData extends Record<string, any> {
  title: string;
  processes: ProcessItem[][];
  onAddProcess?: () => void;
  addProcessLabel?: string;
  menuItems?: NodeMenuItem[];
}
