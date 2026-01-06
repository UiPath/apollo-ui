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
