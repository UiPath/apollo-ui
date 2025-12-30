export interface ToolbarActionItem {
  /** Unique action identifier */
  id: string;
  /** Can be passed as a string (ApIcon icon name) or a custom rendered React node */
  icon: React.ReactNode;
  label?: string;
  disabled?: boolean;
  /** Mark action as always visible */
  isPinned?: boolean;
  /** Toggle state for toggle buttons - controls visual styling (ON/OFF) */
  isToggled?: boolean;
  /** Custom color for the button icon and underline when toggled */
  color?: string;
  onAction: (nodeId: string) => void;
}

export interface ToolbarSeparator {
  id: 'separator';
}

export type ToolbarAction = ToolbarActionItem | ToolbarSeparator;

export interface NodeToolbarConfig {
  actions: ToolbarAction[];
  overflowActions?: ToolbarAction[]; // Actions shown in overflow menu (e.g., more options)
  overflowLabel?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end'; // start = left/top, center = middle, end = right/bottom
}

export interface NodeToolbarProps {
  nodeId: string;
  config: NodeToolbarConfig;
  expanded: boolean;
  /** When true, forcefully hides all toolbar actions including pinned items */
  hidden?: boolean;
}
