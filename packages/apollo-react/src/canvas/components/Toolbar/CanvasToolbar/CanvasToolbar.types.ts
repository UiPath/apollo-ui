import type { PanelPosition } from '@uipath/apollo-react/canvas/xyflow/react';

/**
 * Props for the CanvasToolbar component
 */
export interface CanvasToolbarProps {
  /**
   * Children components (CanvasToolbarButton, CanvasToolbarSeparator, CanvasToolbarToggleGroup)
   */
  children: React.ReactNode;

  /**
   * Position of the toolbar on the canvas
   * @default 'bottom-center'
   */
  position?: PanelPosition;

  /**
   * When true, hides the entire toolbar
   * @default false
   */
  hidden?: boolean;

  /**
   * When true, disables all interactive children (buttons, toggles)
   * @default false
   */
  disabled?: boolean;

  /**
   * Additional CSS classes for the container
   */
  className?: string;
}
