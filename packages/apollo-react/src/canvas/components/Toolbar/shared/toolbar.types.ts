export interface ToolbarActionItem {
  /** Unique action identifier */
  id: string;
  /** Can be passed as a string (icon identifier resolved via the canvas icon registry) or a custom rendered React node */
  icon: React.ReactNode;
  label?: string;
  disabled?: boolean;
  /** Mark action as always visible */
  isPinned?: boolean;
  /** Toggle state for toggle buttons - controls visual styling (ON/OFF) */
  isToggled?: boolean;
  /** Custom color for the button icon and underline when toggled */
  color?: string;
  /**
   * Keeps this action enabled on a read-only node, where `lockToolbarConfig`
   * disables everything else. Set it on actions that only read the node — copy,
   * inspect, navigate — and leave it off for anything that mutates the flow, so
   * an action added later is locked by default.
   */
  allowWhenReadOnly?: boolean;
  onAction: (nodeId: string) => void;
}

export interface ToolbarSeparator {
  id: 'separator';
}

export type ToolbarAction = ToolbarActionItem | ToolbarSeparator;
