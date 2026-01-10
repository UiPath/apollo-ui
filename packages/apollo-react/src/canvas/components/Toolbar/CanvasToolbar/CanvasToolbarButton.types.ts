/**
 * Props for the CanvasToolbarButton component
 */
export interface CanvasToolbarButtonProps {
  /**
   * Icon to display - React node (typically lucide-react icon)
   */
  icon: React.ReactNode;

  /**
   * Accessible label and tooltip content
   */
  label: string;

  /**
   * Click handler
   */
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;

  /**
   * When true, button is disabled
   * Can be inherited from CanvasToolbar context
   * @default false
   */
  disabled?: boolean;

  /**
   * Tooltip placement
   * @default 'top'
   */
  tooltipPlacement?: 'top' | 'bottom' | 'left' | 'right';

  /**
   * Additional CSS classes
   */
  className?: string;
}
