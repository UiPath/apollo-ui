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
  /** Prevents lockToolbarConfig from force-disabling this action when a node is locked. */
  allowWhenLocked?: boolean;
  /** `data-testid` for the action's button or overflow menu item. */
  testId?: string;
  onAction: (nodeId: string) => void;
  /**
   * The pointer or keyboard focus entered or left the action, for a host that previews what
   * it will do. Always ends on `false`, also when the toolbar closes under the pointer.
   */
  onHoverChange?: (nodeId: string, hovered: boolean) => void;
}

export interface ToolbarSeparator {
  id: 'separator';
}

export type ToolbarAction = ToolbarActionItem | ToolbarSeparator;
