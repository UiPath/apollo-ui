export interface ToolbarActionItem {
  /** Unique action identifier */
  id: string;
  /** Can be passed as a string (ApIcon icon name) or a custom rendered React node */
  icon: React.ReactNode;
  label?: string;
  disabled?: boolean;
  onAction: (nodeId: string) => void;
}

export interface ToolbarSeparator {
  id: "separator";
}

export type ToolbarAction = ToolbarActionItem | ToolbarSeparator;

export interface NodeToolbarConfig {
  actions: ToolbarAction[];
  overflowActions?: ToolbarAction[]; // Actions shown in overflow menu (e.g., more options)
  position?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end"; // start = left/top, center = middle, end = right/bottom
}

export interface NodeToolbarProps {
  nodeId: string;
  config: NodeToolbarConfig;
  visible: boolean;
}
