export interface ToolbarAction {
  id: string;
  icon: string;
  label?: string;
  disabled?: boolean;
  onAction: (nodeId: string) => void;
}

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
